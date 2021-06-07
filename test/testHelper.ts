import chaiF from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import faker from "faker";

/*** Assertions ***/
chaiF.use(sinonChai);
chaiF.use(chaiAsPromised);
export const chai = chaiF;
export const expect = chai.expect;
export const assert = chai.assert;

/*** Runners ***/
export { describe, it, before, after, afterEach, beforeEach } from "mocha";

/*** Mocks ***/
export { mockReq, mockRes } from "sinon-express-mock";
export const next = sinon.stub();
export const Faker = faker;

/*** DB ***/
const exec = require("child_process").exec;
const bash = async (cmd) =>
  await exec(cmd, {
    stdio: "inherit",
  });
export const resetDb = async () => {
  await bash("NODE_ENV=test yarn run jake db:reset");
};
export const setupDb = async () => {
  await bash("NODE_ENV=test yarn run jake db:migrate");
};
