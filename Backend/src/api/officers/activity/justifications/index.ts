import express from "express";
import {
    changeOfficerJustificationController,
    createOfficerJustificationController,
    deleteOfficerJustificationController,
    getOfficerActiveJustificationsController,
    getOfficerJustificationDetailsController,
    getOfficerJustificationsHistoryController,
    manageOfficerJustificationController
} from "./controllers";
import {isJustificationEditable, justificationExistsMiddleware} from "./middlewares";

const app = express.Router();

// Route to get the history of justifications of an officer
app.get("/", getOfficerJustificationsHistoryController);

// Route to create a new justification
app.post("/", createOfficerJustificationController);

// Route to get all active justifications of an officer
app.get("/active", getOfficerActiveJustificationsController);

// Route to get the details of a justification
app.get("/:id(\\d+)", justificationExistsMiddleware, getOfficerJustificationDetailsController);

// Route to aprove or deny a justification
app.post("/:id(\\d+)", justificationExistsMiddleware, manageOfficerJustificationController);

// Route to change the details of a justification
app.patch("/:id(\\d+)", justificationExistsMiddleware, isJustificationEditable, changeOfficerJustificationController);

// Route to delete a justification
app.delete("/:id(\\d+)", justificationExistsMiddleware, isJustificationEditable, deleteOfficerJustificationController);

export default app;