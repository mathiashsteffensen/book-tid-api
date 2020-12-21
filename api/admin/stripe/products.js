const Stripe = require('stripe')

const express = require('express')
const bodyParser = require('body-parser')

const productsRouter = express.Router()

productsRouter.get('/products-and-prices/:env', async (req, res, next) =>
{
    let key = req.params.env === 'production' ? process.env.STRIPE_SECRET_KEY : process.env.TEST_STRIPE_SECRET_KEY
    const stripe = Stripe(key)

    const prices = (await stripe.prices.list({active: true})).data
    const products = await Promise.all(prices.map(async price => 
        {
            const product = await stripe.products.retrieve(price.product)
            product.price = price
            return product
        }))
    res.json({
        basic: products.filter(product => product.name === 'Basic'),
        premium: products.filter(product => product.name === 'Premium')
    })
})

module.exports = productsRouter