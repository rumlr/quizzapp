import { DbConnector } from "./dbConnector";
import { QuizzServer } from "./server";

const dbConnector = new DbConnector();
const server = new QuizzServer(dbConnector);
server.start();

process.on("SIGINT", function () {
  console.log("\nStopping server");
  dbConnector.closeDbConnection();
  process.exit();
});