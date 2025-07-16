import express from 'express';
import {
    changeLastCeremonyController,
    getEvaluationDecisionsController,
    getEvaluationFieldsController,
    getEvaluationGradesController, getEventTypesController, getForceTopHoursInWeekController,
    getInactivityTypesController,
    getIntentsController, getLastCeremonyController, getNotificationsController,
    getPatentsController, getPatrolForcesController, getPatrolTypesController, getSpecialUnitsActiveMembersController,
    getSpecialUnitsController,
    getStatusesController, getUserErrorsController
} from "./controllers";
import {logToConsole} from "../../utils/logger";

const app = express.Router();


app.get("/patents", getPatentsController);

app.get("/statuses", getStatusesController);

app.get("/special-units", getSpecialUnitsController);

app.get("/special-units/:id/active", getSpecialUnitsActiveMembersController);

app.get("/intents", getIntentsController);

app.get("/inactivity-types", getInactivityTypesController);

app.get("/patrol-types", getPatrolTypesController);

app.get("/patrol-forces", getPatrolForcesController);

app.get("/evaluation-grades", getEvaluationGradesController);

app.get("/evaluation-fields", getEvaluationFieldsController);

app.get("/evaluation-decisions", getEvaluationDecisionsController);

app.get("/event-types", getEventTypesController);

app.get("/last-ceremony", getLastCeremonyController);

app.put("/last-ceremony", changeLastCeremonyController);

app.get("/notifications", getNotificationsController);

app.get("/errors", getUserErrorsController);

app.get("/top-hours", getForceTopHoursInWeekController);

logToConsole("Util routes loaded successfully", "info");

export default app;