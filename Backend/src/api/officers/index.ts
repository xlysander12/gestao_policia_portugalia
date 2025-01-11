import express from 'express';
import activityRoutes from './activity';
import {officerExistsMiddle} from "../../middlewares";
import {
    addOfficerController,
    alterOfficerController, deleteOfficerController,
    getOfficerDetailsController,
    getOfficersListController
} from "./controllers";

const app = express.Router();

// Route to get a list of all existing officers, following optional filters
app.get("/", getOfficersListController);

// Route to get the details of a specific officer
app.get("/:nif(\\d+)", officerExistsMiddle, getOfficerDetailsController);

// TODO: Add a route to check if the provided nif can be used as a new Officer, and if it belongs to a former Officer or not
// ? Maybe this can be a HEAD route?

// Route to add a new officer
app.put("/:nif(\\d+)", addOfficerController);

// Route to change the details of an existing officer
app.patch("/:nif(\\d+)", officerExistsMiddle, alterOfficerController);

// Route to delete an existing officer
app.delete("/:nif", officerExistsMiddle, deleteOfficerController);


// Load the activity routes
app.use("/:nif(\\d+)/activity", officerExistsMiddle, activityRoutes);

console.log("[Portal Segurança] Officers routes loaded successfully.")

export default app;