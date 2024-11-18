import express from 'express';
import infoRoutes from './info';
import manageRoutes from './manage';
import activityRoutes from './activity';
import {officerExistsMiddle} from "./officer-exists-middle";

const app = express.Router();

// Load the info routes
app.use(infoRoutes);

// Load the management routes
app.use(manageRoutes);

// Load the activity routes
app.use("/:nif/activity", officerExistsMiddle, activityRoutes);

console.log("[Portal Segurança] Officers routes loaded successfully.")

export default app;