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
import {officerJustificationExistsMiddle} from "../../../../middlewares";
import {isJustificationEditable} from "../../../../middlewares/officer-justification-exists";

const app = express.Router();

// Route to get the history of justifications of an officer
app.get("/", getOfficerJustificationsHistoryController);

// Route to create a new justification
app.post("/", createOfficerJustificationController);

// Route to get all active justifications of an officer
app.get("/active", getOfficerActiveJustificationsController);

// Route to get the details of a justification
app.get("/:id", officerJustificationExistsMiddle, getOfficerJustificationDetailsController);

// Route to aprove or deny a justification
app.post("/:id", officerJustificationExistsMiddle, manageOfficerJustificationController);

// Route to change the details of a justification
app.patch("/:id", officerJustificationExistsMiddle, isJustificationEditable, changeOfficerJustificationController);

// Route to delete a justification
app.delete("/:id", officerJustificationExistsMiddle, isJustificationEditable, deleteOfficerJustificationController);

export default app;