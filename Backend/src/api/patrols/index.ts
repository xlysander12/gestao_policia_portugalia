import express from "express";
import {logToConsole} from "../../utils/logger";
import {listPatrolsController} from "./controllers";

const app = express.Router();

// Endpoint to list all past patrols
app.get("/", listPatrolsController);

// Log success
logToConsole("Patrols routes loaded successfully", "info");

// Export the router
export default app;