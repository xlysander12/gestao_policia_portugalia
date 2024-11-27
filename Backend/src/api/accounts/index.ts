// Libs
import express from "express";

// Controllers
import {getUserAccountDetailsController, validateTokenController} from "./controllers";

import infoRoutes from "./info";
import manageRoutes from "./manage";
import actionRoutes from "./action";

const app = express.Router();

// Endpoint to validate a Token and check if the user has the correct permissions
app.post("/validate-token", validateTokenController);

// Endpoint to get a user's accounts information
app.get("/:nif", getUserAccountDetailsController);

// Import action routes
app.use(actionRoutes);

// Import info routes
app.use(infoRoutes);

// Import manage routes
app.use(manageRoutes);

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;