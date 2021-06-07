import {
  describe,
  expect,
  it,
  before,
  afterEach,
  beforeEach,
  setupDb,
  Faker,
} from "../../testHelper";
import { UserInfo, UserWriterService } from "../../../services";
import { BadRequestError } from "../../../types";
import { DB } from "../../../db/prisma";

describe("Services::UserWriterService", () => {
  /* Tests for Static Methods */
  describe("static methods", () => {
    let userInfo: UserInfo = {
      name: "John",
      password: "password",
      email: "john@john.com",
      phoneNumber: "11111111",
      emailConfirmed: false,
      changingEmail: false,
      businessInfo: {
        name: "Biznesssssss",
      },
      emailConfirmationKey: "email-confirmation-key",
      stripeCustomerId: "eahofuea",
    };

    let user: DB.User;

    before(async () => {
      // Find a user fixture
      user = await DB.client.user.findFirst({
        where: {
          bookingSettings: null,
        },
      });

      // Merge the info into the userInfo we'll use to create
      userInfo = {
        ...userInfo,
        ...user,
      };

      // Delete the user from the database so one can be created
      await DB.client.user.delete({
        where: {
          id: user.id,
        },
      });
    });

    after(async () => {
      await DB.client.bookingSettings.delete({
        where: {
          userId: user.id,
        },
      });
    });

    describe("#createWithDefaults", () => {
      const subject = () => UserWriterService.createWithDefaults(userInfo);

      it("should create a user with the right properties", async () => {
        user = await subject();
        expect(user).to.have.property("name", userInfo.name);
        expect(user).to.have.property("email", userInfo.email);
        expect(user.password).to.not.equal(userInfo.password);
      });

      it("Should throw an error when a required value is undefined", async () => {
        delete userInfo.name;
        await expect(subject()).to.be.rejected;
      });
    });

    describe("#confirmEmail", () => {
      let emailKey: string;

      const subject = () => UserWriterService.confirmEmail(emailKey);

      describe("when called with an incorrect emailConfirmationKey", () => {
        it("should throw a BadRequestError", async () => {
          emailKey = "wrong-key";
          await expect(subject()).to.be.rejectedWith(BadRequestError);
        });
      });

      describe("when called with the correct emailConfirmationKey", () => {
        before(() => {
          emailKey = userInfo.emailConfirmationKey;
        });

        it("should return a message saying the email has been confirmed", async () => {
          await expect(subject()).to.eventually.equal(
            "Din e-mail er bekræftet"
          );
        });

        it("should update the database to reflect a confirmed email", async () => {
          await subject();
          user = await DB.client.user.findUnique({
            include: {
              bookingSettings: true,
            },
            where: {
              email: userInfo.email,
            },
          });

          expect(user.emailConfirmed).to.equal(true);
        });
      });
    });
  });

  /* Instance tests */
  describe("instance methods", () => {
    const service = () => new UserWriterService({ userId: user.id });
    let user;

    describe("#updateBookingSettings", () => {
      const newDomainPrefix = Faker.company.companyName().toLowerCase();

      const subject = () =>
        service().updateBookingSettings({
          domainPrefix: newDomainPrefix,
        });

      beforeEach(async () => {
        user = await DB.client.user.findFirst();
        await subject();
      });

      it("should update the bookingSettings", async () => {
        user = await DB.client.user.findUnique({
          include: {
            bookingSettings: true,
          },
          where: {
            id: user.id,
          },
        });

        // @ts-ignore
        expect(user.bookingSettings.domainPrefix).to.equal(newDomainPrefix);
      });
    });

    describe("#addPictureURL", () => {
      const pictureURL = "http://thisisaurl.com";
      const subject = () => service().addPictureURL(pictureURL);
      before(async () => {
        user = await DB.client.user.findFirst();
        await subject();
      });

      it("should be reflected in the database", async () => {
        expect((await service().user).pictureURLs).to.include(pictureURL);
      });
    });

    describe("#removePictureURL", () => {
      const subject = () => service().removePictureURL(pictureURL);

      const pictureURL = "http://thisisaurl.com";
      before(async () => {
        user = await DB.client.user.findFirst();
        await service().addPictureURL(pictureURL);
      });

      it("should remove the pictureURL from the array", async () => {
        await subject();
        user = await DB.client.user.findUnique({
          where: {
            id: user.id,
          },
        });
        expect(user.pictureURLs).not.to.include(pictureURL);
      });
    });
  });
});
