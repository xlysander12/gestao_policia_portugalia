import express from "express";
import {submitIssueController, submitSuggestionController} from "./controllers";
import {logToConsole} from "../../utils/logger";

// Creating the router
const app = express.Router();


app.post("/issue", submitIssueController);

app.post("/suggestion", submitSuggestionController);

logToConsole("Metrics routes loaded successfully", "info");

export default app;