import { DB } from "../../../db/prisma";

const dayjs = require("dayjs");
const stripe = require("../../../integrations/stripe");
const express = require("express");
const bodyParser = require("body-parser");

const { verifyAdminKey } = require("../../../middleware");

const payRouter = express.Router();

payRouter.post(
  "/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.NODE_ENV === "production"
          ? process.env.STRIPE_WEBHOOK_SECRET
          : process.env.TEST_STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // eslint-disable-next-line no-console
    console.log(event.type);
    switch (event.type) {
      case "invoice.payment_succeeded":
        // Invoice has been paid
        const subscriber = await DB.client.subscription.findFirst({
          where: {
            stripeCustomerID: dataObject.customer,
          },
        });

        const subscription = await stripe.subscriptions.retrieve(
          subscriber.subscriptionID
        );

        await DB.client.subscription.update({
          where: {
            stripeCustomerID: dataObject.customer,
          },
          data: {
            subscriptionID: subscription.id,
            currentPeriodEnd: dayjs(subscription["current_period_end"] * 1000)
              .add(1, "day")
              .toJSON(),
            subscriptionType: subscription.plan.product.id,
            subscriptionTypeName: subscription.plan.product.name,
            maxNumberOfCalendars: subscription.quantity,
            status: subscription.status,
            invoiceStatus: subscription.latest_invoice.status,
            lastMonthPaidCents: subscription.latest_invoice.total,
            nextMonthPayCents: subscription.latest_invoice.total,
          },
        });
        break;
      case "invoice.payment_failed":
        // If the payment fails or the customer does not have a valid payment method, an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has failed and to retrieve new card details.
        DB.client.subscription.update({
          where: {
            stripeCustomerID: dataObject.customer,
          },
          data: {
            status: "past_due",
            invoiceStatus: "open",
          },
        });

        // TODO: Add E-Mail notification for customer that their payment failed and they have 7 days to pay

        break;
      case "customer.subscription.deleted":
        await DB.client.subscription.update({
          where: {
            stripeCustomerID: dataObject.customer,
          },
          data: {
            subscriptionID: "",
            cancelAtPeriodEnd: true,
          },
        });

        break;
      default:
      // Unexpected event type
    }
    res.sendStatus(200);
  }
);

payRouter.post(
  "/create-subscription/:apiKey",
  verifyAdminKey,
  async (req, res, next) => {
    // Set the default payment method on the customer
    try {
      await stripe.paymentMethods.attach(req.body.paymentMethodId, {
        customer: req.body.customerId,
      });
    } catch (error) {
      return res.status("402").json({ error: { message: error.message } });
    }

    try {
      await stripe.customers.update(req.body.customerId, {
        // eslint-disable-next-line camelcase
        invoice_settings: {
          // eslint-disable-next-line camelcase
          default_payment_method: req.body.paymentMethodId,
        },
      });

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: req.body.customerId,
        items: [{ price: req.body.priceId, quantity: req.body.quantity }],
        expand: ["latest_invoice.payment_intent", "plan.product"],
      });

      const paymentMethod = await stripe.paymentMethods.retrieve(
        req.body.paymentMethodId
      );

      // Saves the necessary subscription information to the database
      await DB.client.subscription.update({
        where: {
          stripeCustomerID: req.body.customerId,
        },
        data: {
          subscriptionID: subscription.id,
          currentPeriodEnd: dayjs(subscription["current_period_end"] * 1000)
            .add(1, "day")
            .toJSON(),
          status: subscription.status,
          invoiceStatus: subscription.latest_invoice.status,
          lastMonthPaidCents: subscription.latest_invoice.total,
          nextMonthPayCents: subscription.latest_invoice.total,
          paymentMethodBrand: paymentMethod.card.brand,
          paymentMethodLast4: paymentMethod.card.last4,
        },
      });

      res.json(subscription);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      next({ msg: err.msg });
    }
  }
);

payRouter.post(
  "/subscription-complete/:apiKey",
  verifyAdminKey,
  async (req, res) => {
    const subscription = await stripe.subscriptions.retrieve(
      req.user.subscriptionID,
      { expand: ["latest_invoice", "plan.product"] }
    );

    const invoice = await stripe.invoices.retrieveUpcoming({
      subscription: req.user.subscriptionID,
    });

    let nextMonthPay = 0;
    for (const invoiceLineItem of invoice.lines.data) {
      nextMonthPay += invoiceLineItem.amount;
    }

    // Saves the necessary subscription information to the database and provisions access to the purchased services if subscription is paid for
    let updates;
    if (
      subscription.status === "active" &&
      subscription.latest_invoice.status === "paid"
    )
      updates = {
        subscriptionID: subscription.id,
        currentPeriodEnd: dayjs(subscription["current_period_end"] * 1000)
          .add(1, "day")
          .toJSON(),
        subscriptionType: subscription.plan.product.id,
        subscriptionTypeName: subscription.plan.product.name,
        maxNumberOfCalendars: subscription.quantity,
        status: subscription.status,
        invoiceStatus: subscription.latest_invoice.status,
        lastMonthPaidCents: subscription.latest_invoice.total,
        nextMonthPayCents: nextMonthPay,
      };
    else
      updates = {
        subscriptionID: subscription.id,
        currentPeriodEnd: dayjs(subscription["current_period_end"] * 1000)
          .add(1, "day")
          .toJSON(),
        status: subscription.status,
        invoiceStatus: subscription.latest_invoice.status,
        lastMonthPaidCents: subscription.latest_invoice.total,
        nextMonthPayCents: nextMonthPay,
      };

    await DB.client.subscription.update({
      where: {
        stripeCustomerID: req.user.stripeCustomerID,
      },
      data: updates,
    });

    res.send(subscription);
  }
);

payRouter.post("/retry-invoice/:apiKey", verifyAdminKey, async (req, res) => {
  // Set the default payment method on the customer
  try {
    await stripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
    await stripe.customers.update(req.body.customerId, {
      // eslint-disable-next-line camelcase
      invoice_settings: {
        // eslint-disable-next-line camelcase
        default_payment_method: req.body.paymentMethodId,
      },
    });
  } catch (error) {
    // in case card_decline error
    return res
      .status("402")
      .send({ result: { error: { message: error.message } } });
  }

  const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
    expand: ["payment_intent"],
  });

  res.send(invoice);
});

payRouter.post(
  "/cancel-subscription/:apiKey",
  verifyAdminKey,
  async (req, res) => {
    // Delete the subscription
    const deletedSubscription = await stripe.subscriptions.del(
      req.user.subscriptionID
    );

    // Saves the necessary subscription information to the database
    await DB.client.subscription.update({
      where: {
        stripeCustomerID: req.user.stripeCustomerID,
      },
      data: {
        subscriptionID: "",
        cancelAtPeriodEnd: true,
      },
    });

    res.send(deletedSubscription);
  }
);

payRouter.get(
  "/latestInvoice/:subscriptionID/:apiKey",
  verifyAdminKey,
  async (req, res) => {
    const subscription = await stripe.subscriptions.retrieve(
      req.params.subscriptionID,
      { expand: ["latest_invoice.payment_intent", "plan.product"] }
    );

    await DB.client.subscription.update({
      where: {
        stripeCustomerID: req.user.stripeCustomerID,
      },
      data: {
        invoiceStatus: subscription.latest_invoice.status,
      },
    });

    res.json(subscription.latest_invoice);
  }
);

payRouter.post(
  "/retrieve-upcoming-invoice/:apiKey",
  verifyAdminKey,
  async (req, res) => {
    const newPrice = req.body.newPriceId;
    const quantity = req.body.quantity;
    const subscriptionId = req.user.subscriptionID;

    const params = {};
    params["customer"] = req.user.stripeCustomerID;
    let subscription;

    if (subscriptionId != null) {
      params["subscription"] = subscriptionId;
      subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const currentPrice = subscription.items.data[0].price.id;

      if (currentPrice === newPrice) {
        params["subscription_items"] = [
          {
            id: subscription.items.data[0].id,
            quantity,
          },
        ];
      } else {
        params["subscription_items"] = [
          {
            id: subscription.items.data[0].id,
            deleted: true,
          },
          {
            price: newPrice,
            quantity,
          },
        ];
      }
    } else {
      params["subscription_items"] = [
        {
          price: newPrice,
          quantity,
        },
      ];
    }

    const invoice = await stripe.invoices.retrieveUpcoming(params);

    let response = {};

    if (subscriptionId != null) {
      const currentPeriodEnd = subscription.current_period_end;
      let immediateTotal = 0;
      let nextInvoiceSum = 0;

      for (const invoiceLineItem of invoice.lines.data) {
        if (invoiceLineItem.period.end === currentPeriodEnd) {
          immediateTotal += invoiceLineItem.amount;
        } else {
          nextInvoiceSum += invoiceLineItem.amount;
        }
      }

      response = {
        immediateTotal,
        nextInvoiceSum,
        invoice,
      };
    } else {
      response = {
        invoice,
      };
    }

    res.send(response);
  }
);

payRouter.post(
  "/update-subscription/:apiKey",
  verifyAdminKey,
  async (req, res) => {
    const subscriptionId = req.user.subscriptionID;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const currentPrice = subscription.items.data[0].price.id;
    const newPrice = req.body.newPriceId;
    const quantity = req.body.quantity;
    let updatedSubscription;

    if (currentPrice === newPrice) {
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            quantity,
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
            price: newPrice,
            quantity,
          },
        ],
        expand: ["plan.product"],
      });
    }

    const invoice = await stripe.invoices.create({
      customer: subscription.customer,
      subscription: subscription.id,
      description: `Ændring til ${quantity} Medarbejderkalendere på ${updatedSubscription.plan.product.name} planen`,
    });

    await stripe.invoices.pay(invoice.id);
    res.send(updatedSubscription);
  }
);

module.exports = payRouter;
