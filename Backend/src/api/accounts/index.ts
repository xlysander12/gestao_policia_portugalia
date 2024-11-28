// Libs
import express from "express";

// Controllers
import {
    changeUserPasswordController, createAccountController,
    getAccountForcesController,
    getUserAccountDetailsController,
    loginUserController,
    validateTokenController
} from "./controllers";

import manageRoutes from "./manage";

const app = express.Router();

// Endpoint to validate a Token and check if the user has the correct permissions
app.post("/validate-token", validateTokenController);

// Endpoint to login an user
app.post("/login", loginUserController);

// Endpoint to allow an user to change their password
app.post("/change-password", changeUserPasswordController);

// Endpoint to get a user's accounts information
app.get("/:nif", getUserAccountDetailsController);

// Endpoint to create an account
app.post("/:nif", createAccountController);

// Endpoint to fetch all forces an user has access to
app.get("/:nif/forces", getAccountForcesController);

// Import manage routes
app.use(manageRoutes);

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;