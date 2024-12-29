import express from "express";
import {
    createOfficerJustificationController,
    getOfficerJustificationDetailsController,
    getOfficerJustificationsHistoryController
} from "./controllers";

const app = express.Router();

// Route to get the history of justifications of an officer
app.get("/", getOfficerJustificationsHistoryController);

// Route to create a new justification
app.post("/", createOfficerJustificationController);

// Route to get the details of a justification
app.get("/:id(\\d+)", getOfficerJustificationDetailsController);

export default app;