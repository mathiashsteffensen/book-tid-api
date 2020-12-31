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
          await AdminClient.findOneAndUpdate({stripeCustomerID: dataObject.customer}, {
            status: 'active',
            invoiceStatus: 'paid',
            currentPeriodEnd: dayjs().add(1, 'month').add(1, 'day').toJSON()
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
          const subscriber = await AdminClient.findOneAndUpdate({stripeCustomerID: dataObject.customer}, {
            status: 'active',
            subscriptionType: 'free'
          }).exec()

          console.log(subscriber);
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

  res.json(subscription.latest_invoice)
})

module.exports = payRouter