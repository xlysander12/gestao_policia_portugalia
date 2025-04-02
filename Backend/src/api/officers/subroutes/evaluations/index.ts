import {Router} from "express";
import {logToConsole} from "../../../../utils/logger";
import {
    createEvaluationController, editEvaluationController,
    getAuthoredEvaluationsListController,
    getEvaluationDataController,
    getEvaluationsListController
} from "./controllers";
import evaluationExistsMiddleware from "../../../../middlewares/evaluation-exists";

const app = Router();

// Get the list of Evaluations with an Officer as target
app.get("/", getEvaluationsListController);

// Get the list of Evaluations with an Officer as author
app.get("/author", getAuthoredEvaluationsListController);

// Route to create an Evaluation
app.post("/", createEvaluationController);

// * From this point forward, all routes require the Evaluation to exist
app.use("/:id", evaluationExistsMiddleware);

// Route to get the details of an Evaluation
app.get("/:id", getEvaluationDataController);

// Route to update an Evaluation
app.patch("/:id", editEvaluationController);

logToConsole("Officers Evaluations routes loaded successfully", "info");
export default app;