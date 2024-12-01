import express from 'express';
import infoRoutes from './info';
import manageRoutes from './manage';
import activityRoutes from './activity';
import officerExistsMiddle from "../../middlewares/officer-exists";
import {getOfficersListController} from "./controllers";

const app = express.Router();

// Route to get a list of all existing officers, following optional filters
app.get("/", getOfficersListController);

// Load the info routes
app.use(infoRoutes);

// Load the management routes
app.use(manageRoutes);

// Load the activity routes
app.use("/:nif/activity", officerExistsMiddle, activityRoutes);

console.log("[Portal Segurança] Officers routes loaded successfully.")

export default app;