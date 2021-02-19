const stripe = require('../../../integrations/stripe')

const express = require('express')
const { verifyAdminKey } = require('../../../middleware')

const productsRouter = express.Router()

productsRouter.get('/products-and-prices', async (req, res, next) =>
{
    const prices = (await stripe.prices.list({active: true})).data
    const products = await Promise.all(prices.map(async price => 
        {
            const product = await stripe.products.retrieve(price.product)
            product.price = await stripe.prices.retrieve(price.id, {expand: ['tiers']})
            return product
        }))
    res.json({
        premium: products.filter(product => product.name === 'Premium')
    })
})

productsRouter.get('/:productID/:apiKey', verifyAdminKey, (req, res, next) =>
{
    stripe.products.retrieve(req.params.productID)
        .then((product) =>
        {
            res.json(product)
        })
})

module.exports = productsRouter