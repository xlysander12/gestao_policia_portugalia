import {Router} from "express";
import {logToConsole} from "../../../../utils/logger";
import {
    getAuthoredEvaluationsListController,
    getEvaluationDataController,
    getEvaluationsListController
} from "./controllers";
import evaluationExistsMiddleware from "../../../../middlewares/evaluation-exists";

const app = Router();

// Get the list of evaluations with an Officer as target
app.get("/", getEvaluationsListController);

// Get the list of evaluations with an Officer as author
app.get("/author", getAuthoredEvaluationsListController);

// From this point forward, all routes require the evaluation to exist
app.use("/:id", evaluationExistsMiddleware);

app.get("/:id", getEvaluationDataController);

logToConsole("Officers Evaluations routes loaded successfully", "info");
export default app;