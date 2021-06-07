import {
  PrismaClient,
  Prisma,
  User as PrismaUser,
  Subscription as PrismaSubscription,
  BookingSettings as PrismaBookingSettings,
} from "@prisma/client";

const prismaClient = new PrismaClient();

/* eslint-disable-next-line prettier/prettier */
(async () => {
  await prismaClient.$connect();
  /* eslint-disable-next-line prettier/prettier */
});

export module DB {
  export const client = prismaClient;

  export // eslint-disable-next-line camelcase
  type PrismaPromise<T> = Prisma.Prisma__UserClient<T>;

  export type User = PrismaUser;
  export type UserSelect = Prisma.UserSelect;
  export type UserCreateInput = Prisma.UserCreateInput;
  export type UserWhereUniqueInput = Prisma.UserWhereUniqueInput;

  export type Subscription = PrismaSubscription;

  export type BookingSettings = PrismaBookingSettings;
  export type BookingSettingsUpdateArgs = Prisma.BookingSettingsUpdateArgs;
  export type BookingSettingsWhereUniqueInput =
    Prisma.BookingSettingsWhereUniqueInput;
}
