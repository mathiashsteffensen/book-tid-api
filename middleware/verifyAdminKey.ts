import { MyRequestHandler, UnauthorizedError } from "../types";
import { handleError } from "./handleError";
import { CryptographyService } from "../services/CryptographyService";
import { UserReaderService } from "../services";

export const verifyAdminKey: MyRequestHandler = handleError(
  async (req, res, next) => {
    // Check if an access key was provided
    const accessKey = req.params.apiKey || req.header("BOOKTID-ACCESS-KEY");
    if (!accessKey) throw new UnauthorizedError("Unauthorized");

    // Decode the access key
    const cryptographyService = new CryptographyService();
    const payload = cryptographyService.verifyToken(accessKey);

    // Check if the decoded access key contains valid user data
    const userReaderService = new UserReaderService({ email: payload.email });
    if (!(await userReaderService.userExists()))
      throw new UnauthorizedError("Unauthorized");

    const user = await userReaderService.user;

    user.subscription = await userReaderService.getSubscription();

    // Set the user for the request life cycle and call the next function in the middleware chain
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailConfirmed: user.emailConfirmed,
      changingEmail: user.changingEmail,
      changingEmailTo: user.changingEmailTo,
      domainPrefix: user.bookingSettings
        ? user.bookingSettings.domainPrefix
        : null,
      stripeCustomerID: user.subscription?.stripeCustomerID,
      subscriptionType: user.subscription?.subscriptionType,
      subscriptionTypeName: user.subscription?.subscriptionTypeName,
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
      status: user.subscription?.status,
      invoiceStatus: user.subscription?.invoiceStatus,
      subscriptionID: user.subscription?.subscriptionID,
      cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd,
    };

    next();
  }
);
