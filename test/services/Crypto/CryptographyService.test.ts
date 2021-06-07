import { assert, describe, expect, it, before, after } from "../../testHelper";
import { CryptographyService } from "../../../services/CryptographyService";
import { ServerError } from "../../../types";

describe("Services::CryptographyService", () => {
  const service = new CryptographyService();
  const password = "password";
  let hash;

  describe("#encryptPassword", () => {
    it("should never return the same thing twice", async () => {
      hash = await service.encryptPassword(password);
      const firstHash = await service.encryptPassword(password);
      const secondHash = await service.encryptPassword(password);

      expect(firstHash).not.to.equal(secondHash);
    });
  });

  describe("#verifyPassword", () => {
    it("should verify the password and return true", async () => {
      expect(await service.verifyPassword(password, hash)).to.equal(true);
    });
  });
});
