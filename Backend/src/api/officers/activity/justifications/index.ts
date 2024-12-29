import express from "express";
import {
    createOfficerJustificationController,
    getOfficerJustificationDetailsController,
    getOfficerJustificationsHistoryController, manageOfficerJustificationController
} from "./controllers";

const app = express.Router();

// Route to get the history of justifications of an officer
app.get("/", getOfficerJustificationsHistoryController);

// Route to create a new justification
app.post("/", createOfficerJustificationController);

// Route to get the details of a justification
app.get("/:id(\\d+)", getOfficerJustificationDetailsController);

// Route to aprove or deny a justification
app.post("/:id(\\d+)", manageOfficerJustificationController);

export default app;