import express from "express";
import lastShiftRoutes from "./last-shift";
import hoursRoutes from "./hours";
import justificationsRoutes from "./justifications";
import {logToConsole} from "../../../utils/logger";

const app = express.Router();

// Load the last-shift routes
app.use("/last-shift", lastShiftRoutes);

// Load the hours routes
app.use("/hours", hoursRoutes);

// Load the justifications routes
app.use("/justifications", justificationsRoutes);


logToConsole("Officer Activity routes loaded successfully", "info");

export default app;