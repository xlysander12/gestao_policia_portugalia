import express from 'express';
import manageRoutes from './manage';
import activityRoutes from './activity';
import officerExistsMiddle from "../../middlewares/officer-exists";
import {addOfficerController, getOfficerDetailsController, getOfficersListController} from "./controllers";

const app = express.Router();

// Route to get a list of all existing officers, following optional filters
app.get("/", getOfficersListController);

// Route to get the details of a specific officer
app.get("/:nif(\\d+)", officerExistsMiddle, getOfficerDetailsController);

// Route to add a new officer
app.put("/:nif(\\d+)", addOfficerController);

// Load the management routes
app.use(manageRoutes);

// Load the activity routes
app.use("/:nif/activity", officerExistsMiddle, activityRoutes);

console.log("[Portal Segurança] Officers routes loaded successfully.")

export default app;