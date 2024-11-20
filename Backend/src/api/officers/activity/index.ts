import express from "express";
import lastShiftRoutes from "./last-shift";
import hoursRoutes from "./hours";

const app = express.Router();

// Load the last-shift routes
app.use("/last-shift", lastShiftRoutes);

// Load the hours routes
app.use("/hours", hoursRoutes);


console.log("[Portal Segurança] Officer Activity routes loaded successfully.")

export default app;