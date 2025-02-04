import express from 'express';
import {
    getInactivityTypesController,
    getIntentsController,
    getPatentsController, getPatrolForcesController, getPatrolTypesController,
    getSpecialUnitsController,
    getStatusesController
} from "./controllers";
import {logToConsole} from "../../utils/logger";

const app = express.Router();


app.get("/patents", getPatentsController);

app.get("/statuses", getStatusesController);

app.get("/special-units", getSpecialUnitsController);

app.get("/intents", getIntentsController);

app.get("/inactivity-types", getInactivityTypesController);

app.get("/patrol-types", getPatrolTypesController);

app.get("/patrol-forces", getPatrolForcesController);

logToConsole("Util routes loaded successfully", "info");

export default app;