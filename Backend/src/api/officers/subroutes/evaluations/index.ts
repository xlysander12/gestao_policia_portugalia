import {Router} from "express";
import {logToConsole} from "../../../../utils/logger";
import {getEvaluationDataController, getEvaluationsListController} from "./controllers";
import evaluationExistsMiddleware from "../../../../middlewares/evaluation-exists";

const app = Router();

app.get("/", getEvaluationsListController);

// From this point forward, all routes require the evaluation to exist
app.use("/:id", evaluationExistsMiddleware);

app.get("/:id", getEvaluationDataController);

logToConsole("Officers Evaluations routes loaded successfully", "info");
export default app;