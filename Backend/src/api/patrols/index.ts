import express from "express";
import {logToConsole} from "../../utils/logger";
import {createPatrolController, getPatrolController, listPatrolsController} from "./controllers";
import {patrolExistsMiddle} from "../../middlewares";

const app = express.Router();

// Endpoint to list all past patrols
app.get("/", listPatrolsController);

// Endpoint to get the details of a patrol
app.get("/:id", patrolExistsMiddle, getPatrolController);

// Endpoint to add a new patrol
app.post("/", createPatrolController);

// Log success
logToConsole("Patrols routes loaded successfully", "info");

// Export the router
export default app;