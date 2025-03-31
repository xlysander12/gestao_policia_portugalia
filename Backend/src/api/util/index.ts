import express from 'express';
import {
    getEvaluationFieldsController,
    getEvaluationGradesController,
    getInactivityTypesController,
    getIntentsController, getNotificationsController,
    getPatentsController, getPatrolForcesController, getPatrolTypesController,
    getSpecialUnitsController,
    getStatusesController, getUserErrorsController
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

app.get("/evaluation-grades", getEvaluationGradesController);

app.get("/evaluation-fields", getEvaluationFieldsController);

app.get("/notifications", getNotificationsController);

app.get("/errors", getUserErrorsController);

logToConsole("Util routes loaded successfully", "info");

export default app;