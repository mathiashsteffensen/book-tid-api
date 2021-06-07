import { MyRequestHandler } from "../types";
import { UserReaderService } from "../services";

export const parseDomainPrefix: MyRequestHandler = async (req, res, next) => {
  const domainPrefix = req.params.domainPrefix;

  const client = await UserReaderService.userByDomainPrefix(domainPrefix);

  if (client) {
    req.adminEmail = client.email;
    req.client = client;
    req.client.activatedApps = [];
    next();
  } else {
    req.client = null;
    next();
  }
};
