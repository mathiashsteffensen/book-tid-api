-- CreateEnum
CREATE TYPE "SubscriptionTypeName" AS ENUM ('free', 'premium');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT E'active',
    "invoiceStatus" TEXT,
    "subscriptionTypeName" "SubscriptionTypeName" NOT NULL DEFAULT E'free',
    "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN,
    "lastMonthPaidCents" INTEGER,
    "nextMonthPayCents" INTEGER,
    "paymentMethodBrand" TEXT,
    "paymentMethodLast4" TEXT,
    "maxNumberOfCalendars" INTEGER NOT NULL DEFAULT 1,
    "stripeCustomerID" TEXT NOT NULL,
    "subscriptionID" TEXT,
    "subscriptionType" TEXT NOT NULL DEFAULT E'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription.userId_unique" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
