import { createBookingDomain } from "../../utils";
import { DB } from "../../db/prisma";
import { CryptographyService } from "../CryptographyService";
import { BadRequestError } from "../../types";
import uniqid from "uniqid";
import { BaseUserService } from "./BaseUserService";
import { Service } from "../../db/models";
import { createDefaultCalendar } from "../../db/queries";

export interface UserInfo extends DB.UserCreateInput {
  businessInfo: {
    name: string;
  };
  stripeCustomerId: string;
}

export class UserWriterService extends BaseUserService {
  static async createWithDefaults(userInfo: UserInfo) {
    try {
      const cryptoService = new CryptographyService();

      // Merging user info with default info
      const signupParams: DB.UserCreateInput = {
        ...userInfo,
        ...{
          password: await cryptoService.encryptPassword(userInfo.password),
          emailConfirmed: false,
          changingEmail: false,
          pictureURLs: {
            set: [],
          },
          bookingSettings: {
            create: {
              domainPrefix: createBookingDomain(userInfo.businessInfo.name),
              personalDataPolicy: process.env.DEFAULT_PERSONAL_DATA_POLICY,
              agreementDeclaration: process.env.DEFAULT_AGREEMENT_DECLARATION,
            },
          },
          subscription: {
            create: {
              stripeCustomerID: userInfo.stripeCustomerId,
            },
          },
        },
      };

      // @ts-ignore
      delete signupParams?.businessInfo;
      // @ts-ignore
      delete signupParams.stripeCustomerId;

      const user = await DB.client.user.create({
        include: {
          bookingSettings: true,
        },
        data: signupParams,
      });

      // Creates default calendar
      await createDefaultCalendar(user.email, {
        name: { firstName: user.name },
      });

      // Creates a test service
      Service.create({
        adminEmail: user.email,
        name: "Test Service",
        description: "En detaljeret beskrivelse",
        minutesTaken: 30,
        breakAfter: 0,
        cost: 500,
        onlineBooking: true,
        allCalendars: true,
      });

      return user;
    } catch (e) {
      throw new BadRequestError(e.message.slice(0, 5000));
    }
  }

  static async confirmEmail(emailConfirmationKey: string) {
    const client = await DB.client.user.findUnique({
      where: {
        emailConfirmationKey,
      },
    });
    if (!client) {
      throw new BadRequestError(
        "Vi kunne ikke finde din registrerede bruger og bekræfte din e-mail, Kontakt venligst support på service@booktid.net"
      );
    }

    if (!client.changingEmail || !client.changingEmailTo) {
      await DB.client.user.update({
        where: {
          emailConfirmationKey,
        },
        data: {
          emailConfirmed: true,
        },
      });
      return "Din e-mail er bekræftet";
    }

    // Client is changing email and has confirmed so from their old email address, generate a new key and send confirmation to the new email
    const newEmailConfirmationKey = uniqid("BOOKTID-");

    await DB.client.user.update({
      where: {
        emailConfirmationKey,
      },
      data: {
        email: client.changingEmailTo,
        emailConfirmationKey: newEmailConfirmationKey,
        emailConfirmed: false,
        changingEmail: false,
      },
    });

    // Sends an email to confirm the new email address TODO: Add email sending
    //AdminClient.sendSignUpConfirmationEmail(
    //  client.changingEmailTo,
    //  newEmailConfirmationKey
    //).catch((err) => {
    //  throw new ServerError(err);
    //});

    return `Vi har bekræftet ændringen af din email til ${client.changingEmailTo} og har sendt en besked for at bekræfte din nye email`;
  }

  async updateBookingSettings(updates: DB.BookingSettingsUpdateArgs["data"]) {
    const bookingSettings = await DB.client.bookingSettings.update({
      where: {
        userId: (await this.user).id,
      },
      data: updates,
    });

    const user = await this.user;

    user.bookingSettings = bookingSettings;

    return user;
  }

  async addPictureURL(pictureUrl: string) {
    return await DB.client.user.update({
      where: { id: (await this.user).id },
      data: {
        pictureURLs: {
          push: pictureUrl,
        },
      },
    });
  }

  async removePictureURL(pictureUrl: string) {
    const user = await this.user;

    const filteredUrls = user.pictureURLs.filter((url) => url !== pictureUrl);

    return await DB.client.user.update({
      where: { id: (await this.user).id },
      data: {
        pictureURLs: {
          set: filteredUrls,
        },
      },
    });
  }
}
