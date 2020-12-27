const Stripe = require('stripe')
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
      console.log(req.body)
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
      // Remove comment to see the various objects sent for this sample
      console.log(event.type)
      switch (event.type) {
        case 'invoice.paid':
          // Used to provision services after the trial has ended.
          // The status of the invoice will show up as paid. Store the status in your
          // database to reference when a user accesses your service to avoid hitting rate limits.
          break;
        case 'invoice.payment_failed':
          // If the payment fails or the customer does not have a valid payment method,
          //  an invoice.payment_failed event is sent, the subscription becomes past_due.
          // Use this webhook to notify your user that their payment has
          // failed and to retrieve new card details.
          break;
        case 'customer.subscription.deleted':
          if (event.request != null) {
            // handle a subscription cancelled by your request
            // from above.
          } else {
            // handle subscription cancelled automatically based
            // upon your subscription settings.
          }
          break;
        default:
        // Unexpected event type
      }
      res.sendStatus(200);
});

payRouter.post('/create-subscription/:apiKey/:env', verifyAdminKey, async (req, res) => {
  let key = req.params.env === 'production' ? process.env.STRIPE_SECRET_KEY : process.env.TEST_STRIPE_SECRET_KEY
  const reqStripe = Stripe(key)
  // Set the default payment method on the customer
  try {
    await reqStripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
  } catch (error) {
    return res.status('402').send({ error: { message: error.message } });
  }

  await reqStripe.customers.update(
    req.body.customerId,
    {
      invoice_settings: {
        default_payment_method: req.body.paymentMethodId,
      },
    }
  );

  // Create the subscription
  const subscription = await reqStripe.subscriptions.create({
    customer: req.body.customerId,
    items: [
      { price: req.body.priceId, quantity: req.body.quantity },
    ],
    expand: ['latest_invoice.payment_intent', 'plan.product'],
  });

  // Saves the necessary subscription information to the database
  AdminClient.findOneAndUpdate({stripeCustomerID: req.body.customerId}, {
    subscriptionID: subscription.id,
    currentPeriodEnd: subscription["current_period_end"],
    status: subscription.status,
    maxNumberOfCalendars: subscription.quantity,
    subscriptionType: subscription.items[0].price.id
})

  res.send(subscription);
});

payRouter.post('/retry-invoice/apiKey/:env', async (req, res) => {
  let key = req.params.env === 'production' ? process.env.STRIPE_SECRET_KEY : process.env.TEST_STRIPE_SECRET_KEY
  const reqStripe = Stripe(key)
  // Set the default payment method on the customer
  try {
    await reqStripe.paymentMethods.attach(req.body.paymentMethodId, {
      customer: req.body.customerId,
    });
    await reqStripe.customers.update(req.body.customerId, {
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
  res.send(invoice);
});

payRouter.post('/cancel-subscription/apiKey/:env', async (req, res) => {
  let key = req.params.env === 'production' ? process.env.STRIPE_SECRET_KEY : process.env.TEST_STRIPE_SECRET_KEY
  const reqStripe = Stripe(key)
  // Delete the subscription
  const deletedSubscription = await reqStripe.subscriptions.del(
    req.body.subscriptionId
  );
  res.send(deletedSubscription);
});

module.exports = payRouter