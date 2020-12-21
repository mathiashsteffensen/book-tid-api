const stripe = require('../../../stripe')
const express = require('express')
const bodyParser = require('body-parser')

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

module.exports = payRouter