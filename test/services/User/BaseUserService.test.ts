import { assert, before, describe, it } from "../../testHelper";
import { UserReaderService } from "../../../services";

describe("Services::BaseUserService", () => {
  describe("#constructor", () => {
    let findBy = {
      email: undefined,
      userId: undefined,
    };

    const subject = () => new UserReaderService(findBy);

    describe("with undefined arguments", () => {
      before(() => {
        findBy = {
          email: undefined,
          userId: undefined,
        };
      });

      it("should throw an error", () => {
        assert.throws(subject);
      });
    });

    describe("with a wrong email", () => {
      before(() => {
        findBy.email = "this-is-not-any-users-email@email.email";
      });

      it("should not throw an error yet", () => {
        assert.doesNotThrow(subject);
      });
    });
  });
});
