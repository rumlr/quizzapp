import { DbConnector } from "./dbConnector";
import { QuizzServer } from "./server";
import { logWithTime } from "./util";

const dbConnector = new DbConnector();
const server = new QuizzServer(dbConnector);
server.start();

process.on("SIGINT", function () {
  logWithTime("Stopping application...");
  dbConnector.closeDbConnection();
  process.exit();
});