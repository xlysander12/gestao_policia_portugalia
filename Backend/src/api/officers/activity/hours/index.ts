import express from "express";
import {
    addOfficerHoursEntryController, deleteOfficerGetHoursEntryController,
    getOfficerHoursEntryController,
    getOfficerHoursHistoryController
} from "./controllers";

const app = express.Router();

// * Routes to gather information about the hours of an officer
// Route to get the list of hours of an officer
app.get("/", getOfficerHoursHistoryController);

// Route to get a specific entry of hours of an officer
app.get("/:id(\\d+)", getOfficerHoursEntryController);


// * Routes to manage the hours of an officer
// Route to add an entry of hours to an officer
app.post("/", addOfficerHoursEntryController);

// Route to delete an entry of hours of an officer
app.delete("/:id(\\d+)", deleteOfficerGetHoursEntryController);

export default app;