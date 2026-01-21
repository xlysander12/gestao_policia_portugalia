import express from 'express';
import {
    changeLastCeremonyController, getColorsController,
    getEvaluationDecisionsController,
    getEvaluationFieldsController,
    getEvaluationGradesController, getEventTypesController, getForceTopHoursInWeekController,
    getInactivityTypesController,
    getIntentsController, getLastCeremonyController,
    getLastDatesFieldsController, getNotificationsController, getPatentCategoriesController,
    getPatentsController, getPatrolForcesController, getPatrolTypesController, getSpecialUnitsActiveMembersController,
    getSpecialUnitsController,
    getStatusesController, getUserErrorsController
} from "./controllers";
import {logToConsole} from "../../utils/logger";

const app = express.Router();


app.get("/colors", getColorsController);

app.get("/patents", getPatentsController);

app.get("/patent-categories", getPatentCategoriesController);

app.get("/statuses", getStatusesController);

app.get("/special-units", getSpecialUnitsController);

app.get("/special-units/:id/active", getSpecialUnitsActiveMembersController);

app.get("/intents", getIntentsController);

app.get("/last-dates-fields", getLastDatesFieldsController);

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