import express from 'express';
import activityRoutes from './activity';
import {officerExistsMiddle} from "../../middlewares";
import {
    addOfficerController,
    alterOfficerController, deleteOfficerController,
    getOfficerDetailsController,
    getOfficersListController
} from "./controllers";
import {logToConsole} from "../../utils/logger";

const app = express.Router();

// Route to get a list of all existing officers, following optional filters
app.get("/", getOfficersListController);

// Route to get the details of a specific officer
app.get("/:nif", officerExistsMiddle, getOfficerDetailsController);

// Route to add a new officer
app.put("/:nif", addOfficerController);

// Route to change the details of an existing officer
app.patch("/:nif", officerExistsMiddle, alterOfficerController);

// Route to delete an existing officer
app.delete("/:nif", officerExistsMiddle, deleteOfficerController);


// Load the activity routes
app.use("/:nif/activity", officerExistsMiddle, activityRoutes);

logToConsole("Officers routes loaded successfully", "info");

export default app;