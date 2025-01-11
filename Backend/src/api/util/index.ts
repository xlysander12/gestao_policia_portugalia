import express from 'express';
import {
    getInactivityTypesController,
    getIntentsController,
    getPatentsController,
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

logToConsole("Util routes loaded successfully", "info");

export default app;