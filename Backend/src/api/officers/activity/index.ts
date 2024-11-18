import express from "express";
import lastShiftRoutes from "./last-shift";

const app = express.Router();

// Load the last-shift routes
app.use("/last-shift", lastShiftRoutes);

console.log("[Portal Segurança] Officer Activity routes loaded successfully.")

export default app;