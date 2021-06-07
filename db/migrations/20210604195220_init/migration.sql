-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailConfirmed" BOOLEAN NOT NULL,
    "changingEmail" BOOLEAN NOT NULL,
    "changingEmailTo" TEXT,
    "emailConfirmationKey" TEXT NOT NULL,
    "pictureURLs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSettings" (
    "id" TEXT NOT NULL,
    "domainPrefix" TEXT NOT NULL,
    "latestBookingBefore" INTEGER NOT NULL DEFAULT 60,
    "latestCancelBefore" INTEGER NOT NULL DEFAULT 720,
    "maxDaysBookAhead" INTEGER NOT NULL DEFAULT 1092,
    "sendNewBookingEmail" BOOLEAN NOT NULL DEFAULT true,
    "cancelBookingEmail" BOOLEAN NOT NULL DEFAULT true,
    "hideCustomerCommentSection" BOOLEAN NOT NULL DEFAULT false,
    "hideServiceDuration" BOOLEAN NOT NULL DEFAULT false,
    "hideServicePrice" BOOLEAN NOT NULL DEFAULT false,
    "hideContactInfo" BOOLEAN NOT NULL DEFAULT false,
    "hideGoogleMaps" BOOLEAN NOT NULL DEFAULT false,
    "personalDataPolicy" TEXT NOT NULL,
    "agreementDeclaration" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User.phoneNumber_unique" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User.changingEmailTo_unique" ON "User"("changingEmailTo");

-- CreateIndex
CREATE UNIQUE INDEX "User.emailConfirmationKey_unique" ON "User"("emailConfirmationKey");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSettings.domainPrefix_unique" ON "BookingSettings"("domainPrefix");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSettings_userId_unique" ON "BookingSettings"("userId");

-- AddForeignKey
ALTER TABLE "BookingSettings" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
