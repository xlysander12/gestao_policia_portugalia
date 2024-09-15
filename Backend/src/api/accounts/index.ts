import express from "express";

import infoRoutes from "./info";
import manageRoutes from "./manage";
import actionRoutes from "./action";

const app = express.Router();

// Import info routes
app.use(infoRoutes);

// Import manage routes
app.use(manageRoutes);

// Import action routes
app.use(actionRoutes);

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;