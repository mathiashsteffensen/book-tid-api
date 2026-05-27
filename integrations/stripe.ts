import Stripe from "stripe"

const key = process.env.NODE_ENV === "production" ? process.env.STRIPE_SECRET_KEY : process.env.TEST_STRIPE_SECRET_KEY

export type StripeCustomer = Stripe.Customer

export type StripeProduct = Stripe.Product

export type StripePlan = Stripe.Plan & {
  product: StripeProduct
}

export type StripeInvoice = Stripe.Invoice

export type StripeSubscription = Stripe.Subscription & {
  quantity: number
  plan: StripePlan
  latest_invoice: StripeInvoice
}

export const stripe = new Stripe(key, { apiVersion: "2020-08-27" })

export const getStripeSubscription = (id: string) => 
  stripe.subscriptions.retrieve(id, { expand: ["latest_invoice.payment_intent", "plan.product"] }) as unknown as StripeSubscription
