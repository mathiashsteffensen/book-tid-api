import Stripe from 'stripe'
let key = 'pk_test_DLJM7jMAorlAU4GaDIz8QRsT00eIIOBVwx'
const stripe = new Stripe(key, {
    typescript: true,
    apiVersion: "2020-08-27"
})

export default stripe