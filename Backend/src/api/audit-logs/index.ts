import express from "express";
import {logToConsole} from "../../utils/logger";
import {getAuditLogEntryController, listAuditLogsController} from "./controllers";

const app = express.Router({mergeParams: true});

app.get("/", listAuditLogsController);

app.get("/:id", getAuditLogEntryController);

logToConsole("Audit-Logs routes loaded successfully!", "info");

export default app;