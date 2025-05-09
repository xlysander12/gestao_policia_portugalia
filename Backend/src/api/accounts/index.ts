// Libs
import express from "express";

// Controllers
import {
    changeAccountDetailsController,
    changeUserPasswordController, createAccountController, deleteAccountController,
    getAccountForcesController,
    getUserAccountDetailsController,
    loginUserController, logoutUserController, resetPasswordController,
    validateTokenController
} from "./controllers";

import {accountExistsMiddle} from "../../middlewares";
import {logToConsole} from "../../utils/logger";

const app = express.Router();

// Endpoint to validate a Token and check if the user has the correct permissions
app.post("/validate-token", validateTokenController);

// Endpoint to login an user
app.post("/login", loginUserController);

// Endpoint to logout an user
app.post("/logout", logoutUserController);

// Endpoint to allow an user to change their password
app.post("/change-password", changeUserPasswordController);

// Endpoint to fetch all forces an user has access to
app.get("/:nif/forces", accountExistsMiddle, getAccountForcesController);

// Endpoint to reset the password of another account
app.post("/:nif/reset-password", accountExistsMiddle, resetPasswordController);

// Endpoint to get a user's accounts information
app.get("/:nif", accountExistsMiddle, getUserAccountDetailsController);

// Endpoint to create an account
app.post("/:nif", createAccountController);

// Endpoint to edit an account's permissions / suspended statuses
app.patch("/:nif", accountExistsMiddle, changeAccountDetailsController);

// Endpoint to delete an account
// ! This endpoint will rarely be used since there's no big reason to need to delete an account
// ! If an account needs to be deleted, in theory, the officer linked to it should be fired
app.delete("/:nif", accountExistsMiddle, deleteAccountController);


logToConsole("Account routes loaded successfully", "info");

export default app;