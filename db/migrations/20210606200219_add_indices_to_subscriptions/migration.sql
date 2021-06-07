/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerID]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionID]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Subscription.stripeCustomerID_unique" ON "Subscription"("stripeCustomerID");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription.subscriptionID_unique" ON "Subscription"("subscriptionID");
