import {Router} from "express";
import {logToConsole} from "../../../../utils/logger";
import {
    createEvaluationController, deleteEvaluationController, editEvaluationController,
    getAuthoredEvaluationsListController,
    getEvaluationDataController,
    getEvaluationsListController
} from "./controllers";
import evaluationExistsMiddleware, {canCheckEvalsMiddleware} from "../../../../middlewares/evaluations";
import ceremonydecisions from "./subroutes/ceremony_decisions";

const app = Router();

// Get the list of Evaluations with an Officer as target
app.get("/", canCheckEvalsMiddleware, getEvaluationsListController);

// Get the list of Evaluations with an Officer as author
app.get("/author", getAuthoredEvaluationsListController);

// Route to create an Evaluation
app.post("/", canCheckEvalsMiddleware, createEvaluationController);

// Routes of the ceremony decisions
app.use("/decisions", ceremonydecisions);

// * From this point forward, all routes require the Evaluation to exist
app.use("/:id", evaluationExistsMiddleware);

// Route to get the details of an Evaluation
app.get("/:id", getEvaluationDataController);

// Route to update an Evaluation
app.patch("/:id", editEvaluationController);

// Route to delete an Evaluation
app.delete("/:id", deleteEvaluationController);

logToConsole("Officers Evaluations routes loaded successfully", "info");
export default app;