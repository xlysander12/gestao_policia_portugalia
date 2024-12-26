import express from "express";
import manageRoutes from "./manage"
import {getOfficerHoursEntryController, getOfficerHoursHistoryController} from "./controllers";

const app = express.Router();

// * Info routes
// Route to get the list of hours of an officer
app.get("/", getOfficerHoursHistoryController);

// Route to get a specific entry of hours of an officer
app.get("/:id", getOfficerHoursEntryController);

// Manage routes
app.use(manageRoutes);

export default app;