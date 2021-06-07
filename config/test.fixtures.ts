/* eslint eslint-comments/no-use: off */
/* eslint-disable no-console */
/* eslint-disable no-invalid-this */
import { config } from "dotenv";
import server from "../server";
import db from "../db/db";
import {resetDb                                                                                                                                                                                                                                                                                                                                                                                                                       } from "../test/testHelper";
import {DB} from "../db/prisma";
config();

const deleteAllRecords = async () => {
  for (const {
    tablename,
  } of await DB.client.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`) {

    if (tablename !== '_prisma_migrations') {
      try {
        await DB.client.$queryRaw(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log({error})
      }
    }
  }
}

export async function mochaGlobalSetup() {
  this.server = server.listen(8378, () => console.log("Test server running"));
  this.db = db;
  await this.db.dropDatabase();
}

export async function mochaGlobalTeardown() {
  this.server.close();
  await this.db.dropDatabase();
  await deleteAllRecords()
  console.log("Testing complete!");
  this.db.close();

  DB.client.$disconnect()


  process.exit(0)
}
