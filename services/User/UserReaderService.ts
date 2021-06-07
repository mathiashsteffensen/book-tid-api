import { DB } from "../../db/prisma";
import { BaseUserService } from "./BaseUserService";

// Service for interacting with the 'User' database table
export class UserReaderService extends BaseUserService {
  static async userByDomainPrefix(domainPrefix: string) {
    return DB.client.user.findFirst({
      include: {
        bookingSettings: true,
      },
      where: {
        bookingSettings: {
          domainPrefix,
        },
      },
    });
  }

  static async bookingSettingsByDomainPrefix(domainPrefix: string) {
    return DB.client.bookingSettings.findUnique({
      where: {
        domainPrefix,
      },
    });
  }

  async getPictureURLs() {
    const { pictureURLs } = await this.user;

    return pictureURLs;
  }

  async withSubscription() {
    const user = await this.user;

    return await DB.client.user.findUnique({
      include: {
        subscription: true,
      },
      where: {
        id: user.id,
      },
    });
  }

  async getSubscription() {
    const user = await this.user;

    return await DB.client.subscription.findUnique({
      where: {
        userId: user.id,
      },
    });
  }
}
