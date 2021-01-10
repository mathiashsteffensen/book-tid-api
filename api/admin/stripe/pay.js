const Stripe = require('stripe')
const dayjs = require('dayjs')
const stripe = require('../../../stripe')
const express = require('express')
const bodyParser = require('body-parser')

// Importing DB models
const { AdminClient } = require('../../../db/models')

const {
  verifyAdminKey
} = require('../../../middleware')

const payRouter = express.Router()

payRouter.post(
  '/stripe-webhook',
  bodyParser.raw({type: 'application/json'}),
  async (req, res) => {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          'whsec_glrylo8yPChuTWS3NTn79rl7y1Ma9p58'
        );
      } catch (err) {
        console.log(err.message);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      const dataObject = event.data.object;
  
      // Handle the event
      // Review important events for Billing webhooks
      // https://stripe.com/docs/billing/webhooks
      console.log(event.type)
      switch (event.type) {
        case 'invoice.payment_succeeded':
          // Invoice has been paid 
          const subscriber = await AdminClient.findOne({stripeCustomerID: dataObject.customer}).exec()

          const subscription = await stripe.subscriptions.retrieve(subscriber.subscriptionID)

          await AdminClient.findOneAndUpdate({stripeCustomerID: dataObject.customer}, {
            subscriptionID: subscription.id,
            currentPeriodEnd: dayjs(subscription["current_period_end"]*1000).add(1, 'day').toJSON(),
            subscriptionType: subscription.plan.product.id,
            subscriptionTypeName: subscription.plan.product.name,
            maxNumberOfCalendars: subscription.quantity,
            status: subscription.status, 
            invoiceStatus: subscription.latest_invoice.status,                                                                                                         
            lastMonthPaid: subscription.latest_invoice.total,
            nextMonthPay: subscription.latest_invoice.total,
          }).exec()
          break;
        case 'invoice.payment_failed':
          // If the payment fails or the customer does not have a valid payment method, an invoice.payment_failed event is sent, the subscription becomes past_due.
          // Use this webhook to notify your user that their payment has failed and to retrieve new card details.
          await AdminClient.findOneAndUpdate({stripeCustomerID: dataObject.customer}, {
            status: 'past_due',
            invoiceStatus: 'open',
          }).exec()

          // TODO: Add E-Mail notification for customer that their payment failed and they have 7 days to pay
          
          break;
        case 'customer.subscription.deleted':
          await AdminClient.findOneAndUpdate({stripeCustomerID: dataObject.customer}, {
            subscriptionID: '',
            cancelAtPeriodEnd: true,
          }).exec()

          break;
        default:
        // Unexpected event type
      }
      res.sendStatus(200);
});

payRouter.post('/create-subscription/:apiKey', verifyAdminKey, async (req, res) => {
  // Set the default payment method on the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
  } catch (error) {
    return res.status('402').send({ error: { message: error.message } });
  }

  await stripe.customers.update(
    req.body.customerId,
    {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    }
  );

  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: req.body.customerId,
    items: [
      { price: req.body.priceId, quantity: req.body.quantity },
    ],
    expand: ['latest_invoice.payment_intent', 'plan.product'],
  });

  const paymentMethod = await stripe.paymentMethods.retrieve(req.body.paymentMethodId)

  // Saves the necessary subscription information to the database
  await AdminClient.findOneAndUpdate({stripeCustomerID: req.body.customerId}, {
    subscriptionID: subscription.id,
    currentPeriodEnd: dayjs(subscription["current_period_end"]*1000).add(1, 'day').toJSON(),
    status: subscription.status, 
    invoiceStatus: subscription.latest_invoice.status,                                                                                                         
    lastMonthPaid: subscription.latest_invoice.total,
    nextMonthPay: subscription.latest_invoice.total,
    paymentMethodBrand: paymentMethod.card.brand,
    paymentMethodLast4: paymentMethod.card.last4
  }).exec()

  res.send(subscription);
});

payRouter.post('/subscription-complete/:apiKey', verifyAdminKey, async (req, res) =>
{
  const subscription = await stripe.subscriptions.retrieve(req.user.subscriptionID, {expand: ['latest_invoice', 'plan.product'],})

  const invoice = await stripe.invoices.retrieveUpcoming({subscription: req.user.subscriptionID})

  console.log(invoice.lines.data);
  let nextMonthPay = 0
  invoice.lines.data.forEach((invoiceLineItem) => {
    nextMonthPay += invoiceLineItem.amount;
  });

  // Saves the necessary subscription information to the database and provisions access to the purchased services if subscription is paid for
  let updates
  if (subscription.status === 'active' && subscription.latest_invoice.status === 'paid') updates = {
    subscriptionID: subscription.id,
    currentPeriodEnd: dayjs(subscription["current_period_end"]*1000).add(1, 'day').toJSON(),
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
    currentPeriodEnd: dayjs(subscription["current_period_end"]*1000).add(1, 'day').toJSON(),
    status: subscription.status, 
    invoiceStatus: subscription.latest_invoice.status,                                                                                                         
    lastMonthPaid: subscription.latest_invoice.total,
    nextMonthPay,
  }

  await AdminClient.findOneAndUpdate({stripeCustomerID: req.user.stripeCustomerID}, updates).exec()

  res.send(subscription);
})

payRouter.post('/retry-invoice/:apiKey', verifyAdminKey, async (req, res) => {
  // Set the default payment method on the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
    await stripe.customers.update(req.body.customerId, {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    });
  } catch (error) {
    // in case card_decline error
    return res
      .status('402')
      .send({ result: { error: { message: error.message } } });
  }

  const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
    expand: ['payment_intent'],
  });

  console.log(invoice);

  res.send(invoice);
});

payRouter.post('/cancel-subscription/:apiKey', verifyAdminKey, async (req, res) => {
  // Delete the subscription
  const deletedSubscription = await stripe.subscriptions.del(
    req.user.subscriptionID
  );

  // Saves the necessary subscription information to the database
  await AdminClient.findOneAndUpdate({stripeCustomerID: req.user.stripeCustomerID}, {
    subscriptionID: '',
    cancelAtPeriodEnd: true,
  }).exec()
  console.log(deletedSubscription);
  res.send(deletedSubscription);
});

payRouter.get('/latestInvoice/:subscriptionID/:apiKey', verifyAdminKey, async (req, res) =>
{
  const subscription = await stripe.subscriptions.retrieve(req.params.subscriptionID, {expand: ['latest_invoice.payment_intent', 'plan.product'],})

  await AdminClient.findOneAndUpdate({stripeCustomerID: req.user.stripeCustomerID}, {
    invoiceStatus: subscription.latest_invoice.status,                                                                                                         
  }).exec()

  res.json(subscription.latest_invoice)
})

payRouter.post('/retrieve-upcoming-invoice/:apiKey', verifyAdminKey, async (req, res) => {
  const new_price = req.body.newPriceId
  const quantity = req.body.quantity;
  const subscriptionId = req.user.subscriptionID;

  var params = {};
  params['customer'] = req.user.stripeCustomerID;
  var subscription;

  if (subscriptionId != null) {
    params['subscription'] = subscriptionId;
    subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const current_price = subscription.items.data[0].price.id;

    if (current_price == new_price) {
      params['subscription_items'] = [
        {
          id: subscription.items.data[0].id,
          quantity: quantity,
        },
      ];
    } else {
      params['subscription_items'] = [
        {
          id: subscription.items.data[0].id,
          deleted: true,
        },
        {
          price: new_price,
          quantity: quantity,
        },
      ];
    }
  } else {
    params['subscription_items'] = [
      {
        price: new_price,
        quantity: quantity,
      },
    ];
  }
  console.log(params);

  const invoice = await stripe.invoices.retrieveUpcoming(params).catch(err => console.log(err));

  response = {};

  if (subscriptionId != null) {
    const current_period_end = subscription.current_period_end;
    var immediate_total = 0;
    var next_invoice_sum = 0;
    console.log(invoice.lines.data);
    invoice.lines.data.forEach((invoiceLineItem) => {
      if (invoiceLineItem.period.end == current_period_end) {
        immediate_total += invoiceLineItem.amount;
      } else {
        next_invoice_sum += invoiceLineItem.amount;
      }
    });

    response = {
      immediate_total: immediate_total,
      next_invoice_sum: next_invoice_sum,
      invoice: invoice,
    };
  } else {
    response = {
      invoice: invoice,
    };
  }

  res.send(response);
});

payRouter.post('/update-subscription/:apiKey', verifyAdminKey, async (req, res) =>
{
  const subscriptionId = req.user.subscriptionID;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const current_price = subscription.items.data[0].price.id;
  const new_price = req.body.newPriceId
  const quantity = req.body.quantity;
  var updatedSubscription;

  if (current_price == new_price) {
    updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          quantity: quantity,
        },
      ],
    });
  } else {
    updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          deleted: true,
        },
        {
          price: new_price,
          quantity: quantity,
        },
      ],
      expand: ['plan.product'],
    });
  }

  var invoice = await stripe.invoices.create({
    customer: subscription.customer,
    subscription: subscription.id,
    description:
      'Ændring til ' +
      quantity +
      ' Medarbejderkalendere på ' +
      updatedSubscription.plan.product.name +
      ' planen',
  });

  invoice = await stripe.invoices.pay(invoice.id);
  res.send(updatedSubscription);
})

module.exports = payRouter