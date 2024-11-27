// Libs
import express, {CookieOptions} from "express";

// Controllers
import {
    getAccountForcesController,
    getUserAccountDetailsController,
    loginUserController,
    validateTokenController
} from "./controllers";

import manageRoutes from "./manage";
import actionRoutes from "./action";
import {LoginRequestBodyType} from "@portalseguranca/api-types/account/input";
import {getUserForces} from "./repository";
import {RequestError} from "@portalseguranca/api-types";
import {compare} from "bcrypt";
import {generateToken} from "../../utils/user-handler";
import {queryDB} from "../../utils/db-connector";
import {LoginResponse} from "@portalseguranca/api-types/account/output";

const app = express.Router();

// Endpoint to validate a Token and check if the user has the correct permissions
app.post("/validate-token", validateTokenController);

// Endpoint to get a user's accounts information
app.get("/:nif", getUserAccountDetailsController);

// Endpoint to fetch all forces an user has access to
app.get("/:nif/forces", getAccountForcesController);

// Endpoint to login an user
app.post("/login", loginUserController);

// Import action routes
app.use(actionRoutes);

// Import manage routes
app.use(manageRoutes);

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;