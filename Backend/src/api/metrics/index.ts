import express from "express";
import {submitIssueController, submitSuggestionController} from "./controllers";

// Creating the router
const app = express.Router();


app.post("/issue", submitIssueController);

app.post("/suggestion", submitSuggestionController);

console.log("[Portal Segurança] Metrics routes loaded successfully!");

export default app;