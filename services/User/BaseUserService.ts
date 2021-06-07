import { DB } from "../../db/prisma";

export class BaseUserService {
  user: DB.PrismaPromise<
    DB.User & {
      bookingSettings?: DB.BookingSettings;
      subscription?: DB.Subscription;
    }
  >;
  constructor({ email, userId }: { email?: string; userId?: string }) {
    if (userId)
      this.user = DB.client.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          bookingSettings: true,
        },
      });
    else if (email)
      this.user = DB.client.user.findUnique({
        where: {
          email,
        },
        include: {
          bookingSettings: true,
        },
      });
    else
      throw new Error(
        "Specify an email or userId to initialize UserReaderService"
      );
  }

  async userExists() {
    const user = await this.user;
    return Boolean(user);
  }
}
