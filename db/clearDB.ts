import db from "./db";
require("dotenv").config();

async function main() {
  await db.dropDatabase();
  console.log("DB Dropped");
}

main();
