import express from 'express';
import activityRoutes from './activity';
import {officerExistsMiddle} from "../../middlewares";
import {
    addOfficerController,
    alterOfficerController, deleteOfficerController, getOfficerCurrentPatrolController,
    getOfficerDetailsController,
    getOfficersListController, restoreOfficerController
} from "./controllers";
import {logToConsole} from "../../utils/logger";

const app = express.Router();

// Route to get a list of all existing officers, following optional filters
app.get("/", getOfficersListController);

// * From this point, all the routes require the officer to exist
app.use("/:nif", officerExistsMiddle);

// Route to get the details of a specific officer
app.get("/:nif", getOfficerDetailsController);

// Route to add a new officer
app.put("/:nif", addOfficerController);

// Route to change the details of an existing officer
app.patch("/:nif", alterOfficerController);

// Route to delete an existing officer
app.delete("/:nif", deleteOfficerController);

// Route to restore an officer
app.post("/:nif/restore", restoreOfficerController);

// Route to fetch the current officer's patrol
app.get("/:nif/patrol", getOfficerCurrentPatrolController);

// Load the activity routes
app.use("/:nif/activity", activityRoutes);

logToConsole("Officers routes loaded successfully", "info");

export default app;