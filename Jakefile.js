require("dotenv").config();
const { desc, task, namespace } = require("jake");
const exec = require("child_process").execSync;
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const {
  Builder,
  fixturesIterator,
  Loader,
  Parser,
  Resolver,
} = require("@getbigger-io/prisma-fixtures-cli");

const bash = (cmd) =>
  exec(cmd, {
    stdio: "inherit",
  });

// TODO: move these tasks to their own directory in separate files

/***  Database Tasks  ***/
namespace("db", () => {
  desc(
    "Create DB migration, a name can be configured with name=name_of_migration, the type of migration run depends on the NODE_ENV variable"
  );
  task("migrate", () => {
    const name = process.env.name || "migration";
    const env = process.env.NODE_ENV || "development";

    const dbUrl = process.env.DATABASE_URL.replace("development", env);
    const cmd = env === "development" ? "dev" : "deploy";
    const options = `--schema=./db/schema.prisma ${
      env === "development" ? ` --name ${name}` : ""
    }`;

    bash(`DATABASE_URL=${dbUrl} yarn run prisma migrate ${cmd} ${options}`);
  });

  desc("");
  task("reset", () => {
    const env = process.env.NODE_ENV || "development";

    const dbUrl = process.env.DATABASE_URL.replace("development", env);
    bash(
      `DATABASE_URL=${dbUrl} yarn run prisma migrate reset --schema=./db/schema.prisma --force`
    );
  });
});

/***  Linting Tasks  ***/
const lintBaseCmd = "yarn run eslint --config ./config/.eslintrc.yml ./**/*.ts";
desc("Run ESLint for the whole project");
task("lint", () => {
  bash(`${lintBaseCmd} --fix-dry-run`);
});

namespace("lint", () => {
  desc("Run ESLint and fix issues");
  task("fix", () => {
    bash(`${lintBaseCmd} --fix`);
  });
});

/***  Testing Tasks  ***/
const testBaseCmd = `NODE_ENV=test DATABASE_URL=${process.env.DATABASE_URL.replace(
  "development",
  "test"
)} ts-mocha --require config/test.fixtures.ts --config config/.mocharc.yml`;

namespace("fixtures", () => {
  task("load", async () => {
    await bash(
      `fixtures ./test/fixtures --require=ts-node/register --require=tsconfig-paths/register --databaseUrl=${process.env.DATABASE_URL.replace(
        "development",
        "test"
      )}`
    );
  });
});

desc("Run all tests");
task("test", ["fixtures:load"], () => {
  bash(`${testBaseCmd} test/**/*.test.ts`);
});

namespace("test", () => {
  desc("Watch all files with a .ts extension and run tests on change");
  task("watch", ["fixtures:load"], () => {
    bash(`${testBaseCmd} test/**/*.test.ts -w --watch-extensions ts`);
  });

  desc("Run all middleware tests");
  task("middleware", ["fixtures:load"], () => {
    bash(`${testBaseCmd} test/middleware/**/*.test.ts`);
  });

  namespace("middleware", () => {
    desc("Watch and rerun middleware tests");
    task("watch", ["fixtures:load"], () => {
      bash(
        `${testBaseCmd} test/middleware/**/*.test.ts -w --watch-extensions ts`
      );
    });
  });

  desc("Run all services tests");
  task("services", ["fixtures:load"], () => {
    bash(`${testBaseCmd} test/services/**/*.test.ts`);
  });

  namespace("services", () => {
    desc("Watch and rerun services tests");
    task("watch", ["fixtures:load"], () => {
      bash(
        `${testBaseCmd} test/services/**/*.test.ts -w --watch-extensions ts`
      );
    });
  });
});
