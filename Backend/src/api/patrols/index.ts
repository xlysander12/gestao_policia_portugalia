import express from "express";
import {logToConsole} from "../../utils/logger";
import {createPatrolController, editPatrolController, getPatrolController, listPatrolsController} from "./controllers";
import {patrolExistsMiddle} from "../../middlewares";

const app = express.Router();

// Endpoint to list all past patrols
app.get("/", listPatrolsController);

// Endpoint to add a new patrol
app.post("/", createPatrolController);

// Endpoint to get the details of a patrol
app.get("/:id", patrolExistsMiddle, getPatrolController);

// Endpoint to edit a patrol
app.patch("/:id", patrolExistsMiddle, editPatrolController);

// Log success
logToConsole("Patrols routes loaded successfully", "info");

// Export the router
export default app;