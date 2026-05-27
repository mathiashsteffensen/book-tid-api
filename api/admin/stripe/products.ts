import express from "express"

import { stripe } from "integrations/stripe"
import { verifyAdminKey } from "middleware"

const productsRouter = express.Router()

productsRouter.get("/products", async (_, res) => {
  const products = (await stripe.products.list({
    active: true,
    expand: ["data.default_price.tiers"]
  })).data

  res.json(products)
})

productsRouter.get("products/:id", verifyAdminKey, async (req, res) => {
  const product = await stripe.products.retrieve(req.params.id)

  res.json(product)
})

export default productsRouter
