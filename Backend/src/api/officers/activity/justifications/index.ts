import express from "express";
import {
    changeOfficerJustificationController,
    createOfficerJustificationController,
    getOfficerJustificationDetailsController,
    getOfficerJustificationsHistoryController, manageOfficerJustificationController
} from "./controllers";
import {justificationExistsMiddleware} from "./middlewares";

const app = express.Router();

// Route to get the history of justifications of an officer
app.get("/", getOfficerJustificationsHistoryController);

// Route to create a new justification
app.post("/", createOfficerJustificationController);

// Route to get the details of a justification
app.get("/:id(\\d+)", justificationExistsMiddleware, getOfficerJustificationDetailsController);

// Route to aprove or deny a justification
app.post("/:id(\\d+)", justificationExistsMiddleware, manageOfficerJustificationController);

// Route to change the details of a justification
app.patch("/:id(\\d+)", justificationExistsMiddleware, changeOfficerJustificationController);

export default app;