import { verifyAdminKey } from "../../middleware";
import {
  next,
  expect,
  mockRes,
  mockReq,
  describe,
  it,
  before,
} from "../testHelper";
import { AccessKeyFixture } from "../fixtures/AccessKey.fixture";
import { AdminClientFixture } from "../fixtures/AdminClient.fixture";
import { DB } from "../../db/prisma";

describe("Middleware::verifyAdminKey", () => {
  describe("with missing access key", () => {
    const req = mockReq();
    const res = mockRes();

    it("should respond with 401 status code", async () => {
      await verifyAdminKey(req, res, next);
      expect(res.status).to.be.calledWith(401);
    });
  });

  describe("with malformed access key", () => {
    const req = mockReq({
      params: {
        apiKey: "thisisnotajwttoken",
      },
    });
    const res = mockRes();

    it("should respond with 401 status code", async () => {
      await verifyAdminKey(req, res, next);
      expect(res.status).to.be.calledWith(401);
    });
  });

  describe("with invalid access key", () => {
    const invalidKey = AccessKeyFixture.create();
    const req = mockReq({
      params: {
        apiKey: invalidKey,
      },
    });
    const res = mockRes();

    it("should respond with 401 status code", async () => {
      await verifyAdminKey(req, res, next);
      expect(res.status).to.be.calledWith(401);
    });
  });

  describe("with valid access key", () => {
    let user;
    let accessKey;

    let req = mockReq({
      params: {
        apiKey: accessKey,
      },
    });
    const res = mockRes();
    before(async () => {
      user = await DB.client.user.findFirst();
      accessKey = AccessKeyFixture.create(user.email);
      req = mockReq({
        params: {
          apiKey: accessKey,
        },
      });
    });
    it("should call NextFunction", async () => {
      await verifyAdminKey(req, res, next);
      expect(next).to.be.calledWith();
    });
  });
});
