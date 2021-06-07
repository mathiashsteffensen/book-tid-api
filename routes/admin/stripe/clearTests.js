const Stripe = require('stripe')
require('dotenv').config()

// TODO: Add script to clear Stripe test data and prevent it from being cluttered, maybe run on deployment
async function main()
{
    const stripe = Stripe(process.env.TEST_STRIPE_SECRET_KEY)

    const subscriptions = (await stripe.subscriptions.list({limit: 100})).data
    console.log('Deleting ' + subscriptions.length + ' Subscriptions');
    await Promise.all(subscriptions.map(async (subscription) => 
    {
        // Set timeout to not exceed request rate limit on the Stripe API
        return setTimeout(() => stripe.subscriptions.del(subscription.id), Math.random() * 3500)
    }))

    const customers = (await stripe.customers.list({limit: 100})).data
    console.log('Deleting ' + customers.length + ' Customers');
    await Promise.all(customers.map(async (customer) => 
    {
        // Set timeout to not exceed request rate limit on the Stripe API
        return setTimeout(() => stripe.customers.del(customer.id), Math.random() * 3500)
    }))
}
try
{
    main()
} catch(err) {console.error(err)}
