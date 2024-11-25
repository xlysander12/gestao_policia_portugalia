import express from "express";
import infoRoutes from "./info"
import manageRoutes from "./manage"

const app = express.Router();

// Info routes
app.use(infoRoutes);

// Manage routes
app.use(manageRoutes);

export default app;