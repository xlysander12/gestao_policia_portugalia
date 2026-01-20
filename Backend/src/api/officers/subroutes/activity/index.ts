import express from "express";
import lastDatesRoutes from "./last-dates";
import hoursRoutes from "./hours";
import justificationsRoutes from "./justifications";
import {logToConsole} from "../../../../utils/logger";

const app = express.Router();

// Load the last-shift routes
app.use("/last-dates", lastDatesRoutes);

// Load the hours routes
app.use("/hours", hoursRoutes);

// Load the justifications routes
app.use("/justifications", justificationsRoutes);


logToConsole("Officer Activity routes loaded successfully", "info");

export default app;