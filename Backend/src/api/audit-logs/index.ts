import express from "express";
import {logToConsole} from "../../utils/logger";
import {listAuditLogsController} from "./controllers";

const app = express.Router();

app.get("/", listAuditLogsController);

logToConsole("Audit-Logs routes loaded successfully!", "info");

export default app;