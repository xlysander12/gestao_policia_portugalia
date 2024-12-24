import express from "express";
import manageRoutes from "./manage"
import {getOfficerHoursHistoryController} from "./controllers";

const app = express.Router();

// * Info routes
// Route to get the list of hours of an officer
app.get("/", getOfficerHoursHistoryController);


// Manage routes
app.use(manageRoutes);

export default app;