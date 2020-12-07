const Stripe = require('stripe')
let key = process.env.NODE_ENV === 'production' ? process.env.STRIPE_SECRET_KEY : process.env.TEST_STRIPE_SECRET_KEY
const stripe = Stripe(key)



module.exports = stripe