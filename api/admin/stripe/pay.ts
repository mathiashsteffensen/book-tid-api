import express from "express"
import bodyParser from "body-parser"
import { DateHelper } from "helpers/DateHelper"

import {
  getStripeSubscription,
  stripe, StripeCustomer, StripeSubscription
} from "integrations/stripe"
import { AdminClient } from "db/models"
import { verifyAdminKey } from "middleware"
import {
  MyRequest, ServerError
} from "types"

const payRouter = express.Router()

payRouter.post(
  "/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.NODE_ENV === "production" ? process.env.STRIPE_WEBHOOK_SECRET : process.env.TEST_STRIPE_WEBHOOK_SECRET
    )
    // Extract the object from the event.
    const dataObject = event.data.object
  
    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    console.log(event.type)
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const { customer } = dataObject as { customer: StripeCustomer["id"] }

        // Invoice has been paid 
        const subscriber = await AdminClient.findOne({ stripeCustomerID: customer }).exec()

        const subscription = await getStripeSubscription(subscriber.subscriptionID)

        await AdminClient.updateOne({ stripeCustomerID: customer }, {
          subscriptionID: subscription.id,
          currentPeriodEnd: DateHelper.new(subscription["current_period_end"] * 1000).add(1, "day").toDate(),
          subscriptionType: subscription.plan.product.id,
          subscriptionTypeName: subscription.plan.product.name,
          maxNumberOfCalendars: subscription.quantity,
          status: subscription.status,
          invoiceStatus: subscription.latest_invoice.status,
          lastMonthPaid: subscription.latest_invoice.total,
          nextMonthPay: subscription.latest_invoice.total,
        }).exec()
        break
      }
      case "invoice.payment_failed": {
        const { customer } = dataObject as { customer: StripeCustomer["id"] }

        // If the payment fails or the customer does not have a valid payment method, an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has failed and to retrieve new card details.
        await AdminClient.findOneAndUpdate({ stripeCustomerID: customer }, {
          status: "past_due",
          invoiceStatus: "open",
        }).exec()

        // TODO: Add E-Mail notification for customer that their payment failed and they have 7 days to pay

        break
      }
      case"customer.subscription.deleted": {
        const { customer } = dataObject as { customer: StripeCustomer["id"] }

        await AdminClient.findOneAndUpdate({ stripeCustomerID: customer }, {
          subscriptionID: "",
          cancelAtPeriodEnd: true,
        }).exec()

        break
      }
      default:
        // Unexpected event type
    }
    res.sendStatus(200)
  })

payRouter.post("/create-subscription/:apiKey", verifyAdminKey, async (req: MyRequest, res) => {
  const customer =
      req.user.stripeCustomerID
        ? await stripe.customers.retrieve(req.user.stripeCustomerID)
        : await stripe.customers
          .create({ email: req.body.email, })
          .catch((err) => {
            console.log(err)
            throw new ServerError(err)
          })

  await AdminClient.findByIdAndUpdate(req.user._id, { stripeCustomerID: customer.id, }).exec()

  // Set the default payment method on the customer
  await stripe.paymentMethods.attach(req.body.paymentMethodId, { customer: customer.id, })

  await stripe.customers.update(
    customer.id,
    { invoice_settings: { default_payment_method: req.body.paymentMethodId, }, }
  )

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      {
        price: req.body.priceId, quantity: req.body.quantity
      },
    ],
    expand: ["latest_invoice.payment_intent", "plan.product"],
  }) as unknown as StripeSubscription

  const paymentMethod = await stripe.paymentMethods.retrieve(req.body.paymentMethodId)

  // Saves the necessary subscription information to the database
  await AdminClient.findOneAndUpdate({ stripeCustomerID: customer.id }, {
    subscriptionID: subscription.id,
    currentPeriodEnd: DateHelper.new(subscription["current_period_end"]*1000).add(1, "day").toJSON(),
    status: subscription.status, 
    invoiceStatus: subscription.latest_invoice.status,                                                                                                         
    lastMonthPaid: subscription.latest_invoice.total,
    nextMonthPay: subscription.latest_invoice.total,
    paymentMethodBrand: paymentMethod.card.brand,
    paymentMethodLast4: paymentMethod.card.last4
  }).exec()

  res.json(subscription)
})

payRouter.post("/subscription-complete/:apiKey", verifyAdminKey, async (req: MyRequest, res) => {
  const subscription = await getStripeSubscription(req.user.subscriptionID)

  const invoice = await stripe.invoices.retrieveUpcoming({ subscription: req.user.subscriptionID })

  console.log(invoice.lines.data)
  let nextMonthPay = 0
  invoice.lines.data.forEach((invoiceLineItem) => {
    nextMonthPay += invoiceLineItem.amount
  })

  // Saves the necessary subscription information to the database and provisions access to the purchased services if subscription is paid for
  let updates
  if (subscription.status === "active" && subscription.latest_invoice.status === "paid") updates = {
    subscriptionID: subscription.id,
    currentPeriodEnd: DateHelper.new(subscription["current_period_end"]*1000).add(1, "day").toJSON(),
    subscriptionType: subscription.plan.product.id,
    subscriptionTypeName: subscription.plan.product.name,
    maxNumberOfCalendars: subscription.quantity,
    status: subscription.status, 
    invoiceStatus: subscription.latest_invoice.status,                                                                                                         
    lastMonthPaid: subscription.latest_invoice.total,
    nextMonthPay,
  } 
  else updates = {
    subscriptionID: subscription.id,
    currentPeriodEnd: DateHelper.new(subscription["current_period_end"]*1000).add(1, "day").toJSON(),
    status: subscription.status, 
    invoiceStatus: subscription.latest_invoice.status,                                                                                                         
    lastMonthPaid: subscription.latest_invoice.total,
    nextMonthPay,
  }

  await AdminClient.findOneAndUpdate({ stripeCustomerID: req.user.stripeCustomerID }, updates).exec()

  res.send(subscription)
})

payRouter.post("/retry-invoice/:apiKey", verifyAdminKey, async (req, res) => {
  // Set the default payment method on the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, { customer: req.body.customerId, })
    await stripe.customers.update(req.body.customerId, { invoice_settings: { default_payment_method: req.body.paymentMethodId, }, })
  } catch (error) {
    // in case card_decline error
    return res
      .status(400)
      .send({ result: { error: { message: error.message } } })
  }

  const invoice = await stripe.invoices.retrieve(req.body.invoiceId, { expand: ["payment_intent"], })

  console.log(invoice)

  res.send(invoice)
})

payRouter.post("/cancel-subscription/:apiKey", verifyAdminKey, async (req: MyRequest, res) => {
  // Delete the subscription
  const deletedSubscription = await stripe.subscriptions.del(
    req.user.subscriptionID
  )

  // Saves the necessary subscription information to the database
  await AdminClient.findOneAndUpdate({ stripeCustomerID: req.user.stripeCustomerID }, {
    subscriptionID: "",
    cancelAtPeriodEnd: true, 
  }).exec()
  console.log(deletedSubscription)
  res.send(deletedSubscription)
})

payRouter.get("/latestInvoice/:subscriptionID/:apiKey", verifyAdminKey, async (req: MyRequest, res) => {
  const subscription = await getStripeSubscription(req.params.subscriptionID)

  await AdminClient.findOneAndUpdate({ stripeCustomerID: req.user.stripeCustomerID }, { invoiceStatus: subscription.latest_invoice.status }).exec()

  res.json(subscription.latest_invoice)
})

payRouter.post("/retrieve-upcoming-invoice/:apiKey", verifyAdminKey, async (req: MyRequest, res) => {
  const new_price = req.body.newPriceId
  const quantity = req.body.quantity
  const subscriptionId = req.user.subscriptionID

  const params = {}
  params["customer"] = req.user.stripeCustomerID
  let subscription

  if (subscriptionId != null) {
    params["subscription"] = subscriptionId
    subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const current_price = subscription.items.data[0].price.id

    if (current_price == new_price) {
      params["subscription_items"] = [
        {
          id: subscription.items.data[0].id,
          quantity: quantity, 
        },
      ]
    } else {
      params["subscription_items"] = [
        {
          id: subscription.items.data[0].id,
          deleted: true, 
        }, {
          price: new_price,
          quantity: quantity, 
        },
      ]
    }
  } else {
    params["subscription_items"] = [
      {
        price: new_price,
        quantity: quantity, 
      },
    ]
  }
  console.log(params)

  const invoice = await stripe.invoices.retrieveUpcoming(params)

  let response

  if (subscriptionId != null) {
    const current_period_end = subscription.current_period_end
    let immediate_total = 0
    let next_invoice_sum = 0
    console.log(invoice.lines.data)
    invoice.lines.data.forEach((invoiceLineItem) => {
      if (invoiceLineItem.period.end == current_period_end) {
        immediate_total += invoiceLineItem.amount
      } else {
        next_invoice_sum += invoiceLineItem.amount
      }
    })

    response = {
      immediate_total: immediate_total,
      next_invoice_sum: next_invoice_sum,
      invoice: invoice,
    }
  } else {
    response = { invoice: invoice, }
  }

  res.send(response)
})

payRouter.post("/update-subscription/:apiKey", verifyAdminKey, async (req: MyRequest, res) => {
  const subscriptionId = req.user.subscriptionID

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const current_price = subscription.items.data[0].price.id
  const new_price = req.body.newPriceId
  const quantity = req.body.quantity
  let updatedSubscription

  if (current_price == new_price) {
    updatedSubscription = await stripe.subscriptions.update(subscriptionId, { items: [
      {
        id: subscription.items.data[0].id,
        quantity: quantity, 
      },
    ], })
  } else {
    updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          deleted: true, 
        }, {
          price: new_price,
          quantity: quantity, 
        },
      ],
      expand: ["plan.product"], 
    })
  }

  const invoice = await stripe.invoices.create({
    customer: subscription.customer as string,
    subscription: subscription.id,
    description:
      "Ændring til " +
      quantity +
      " Medarbejderkalendere på " +
      updatedSubscription.plan.product.name +
      " planen",
  })

  await stripe.invoices.pay(invoice.id)
  res.send(updatedSubscription)
})

export default payRouter
