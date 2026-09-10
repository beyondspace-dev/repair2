import makeLogFile from "../logs/logFile";
import { createLogReporter } from "../logs/reportLog";
import type { MainApp } from "./mainApp";

export function createReporter(app: MainApp) {
  return createLogReporter({
    makeLogFile,
    app
  });
}
