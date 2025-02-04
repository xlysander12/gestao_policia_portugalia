import {APIResponse} from "../../../types";
import {
    ChangeAccountInfoRequestBodyType,
    ChangePasswordRequestBodyType,
    LoginRequestBodyType,
    ValidateTokenRequestBodyType
} from "@portalseguranca/api-types/account/input";
import {FORCE_HEADER} from "../../../utils/constants";
import {
    AccountInfoResponse, LoginResponse,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/account/output";
import express, {CookieOptions} from "express";
import {
    changeUserPassword, changeUserPermissions,
    changeUserSuspendedStatus,
    createAccount,
    deleteUser,
    getUserDetails,
    loginUser, logoutUser, resetUserPassword,
    validateToken
} from "../services";
import {getAccountForces} from "../services";
import {AccountInfoAPIResponse} from "../../../types/response-types";

export async function validateTokenController (req: express.Request, res: APIResponse<ValidateTokenResponse>): Promise<void> {
    let {intents} = req.body as ValidateTokenRequestBodyType;

    // Call the service
    let isTokenValid = await validateToken(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, intents);

    // Check the result of the service
    if (!isTokenValid.result) { // The result was negative, user doesn't have requested intents
        res.status(isTokenValid.status).json({message: isTokenValid.message!});
        return
    }

    // The result was positive, user has requested intents
    res.status(isTokenValid.status).json({message: isTokenValid.message!, data: res.locals.loggedOfficer.nif});

}

export async function getUserAccountDetailsController(req: express.Request, res: AccountInfoAPIResponse<AccountInfoResponse>): Promise<void> {
    let userDetails = await getUserDetails(res.locals.loggedOfficer.nif, res.locals.targetAccount, req.header(FORCE_HEADER)!);

    if (!userDetails.result) {
        res.status(userDetails.status).json({message: userDetails.message});
        return;
    }

    res.status(userDetails.status).json({
        message: userDetails.message,
        data: userDetails.data!
    });
}

export async function getAccountForcesController(req: express.Request, res: APIResponse<UserForcesResponse>) {
    let {nif} = req.params;

    // Call the service
    let serviceResult = await getAccountForces(res.locals.loggedOfficer.nif, Number(nif));

    if (!serviceResult.result) {
        res.status(serviceResult.status).json({message: serviceResult.message});
        return;
    }

    res.status(serviceResult.status).json({message: serviceResult.message, data: {forces: serviceResult.data!}});
}

export async function loginUserController(req: express.Request, res: APIResponse<LoginResponse>) {
    const {nif, password, persistent} = req.body as LoginRequestBodyType;

    // Login the user and get the token
    let loginData = await loginUser(nif, password, persistent);

    // If the result of the service was negative, return an error
    if (!loginData.result) {
        res.status(loginData.status).json({message: loginData.message});
        return;
    }

    // Build the Cookie Options
    let cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: process.env.PS_IS_PRODUCTION === "true"
    }

    // If the login is marked as "persistent", set the cookie to last 400 days (max allowed age by Chrome)
    if (persistent) {
        cookieOptions.maxAge = 1000 * 60 * 60 * 24 * 400; // 400 days
    }

    // Append the cookie to the response
    res.cookie("sessionToken", loginData.data?.token, cookieOptions);

    // Send the token to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: {
            token: loginData.data!.token,
            forces: loginData.data!.forces
        }
    });
}

export async function logoutUserController(req: express.Request, res: APIResponse) {
    // Call the service to remove the token from the database
    let result = await logoutUser(res.locals.loggedOfficer.nif, req.cookies["sessionToken"] || req.header("Authorization"));

    // Clear the cookie
    res.clearCookie("sessionToken");

    // Return the result
    res.status(result.status).json({message: result.message});
}

export async function changeUserPasswordController(req: express.Request, res: APIResponse) {
    const {oldPassword, newPassword, confirmPassword} = req.body as ChangePasswordRequestBodyType;

    const serviceResult = await changeUserPassword(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, oldPassword, newPassword, confirmPassword, req.cookies["sessionToken"] || req.header("Authorization"));

    res.status(serviceResult.status).json({message: serviceResult.message});
}

export async function createAccountController(req: express.Request, res: APIResponse) {
    const {nif} = req.params;

    // Call the service
    let serviceResult = await createAccount(Number(nif), req.header(FORCE_HEADER)!);

    // Return the result of the service
    res.status(serviceResult.status).json({message: serviceResult.message});
}

export async function changeAccountDetailsController(req: express.Request, res: APIResponse) {
    const {suspended, intents} = req.body as ChangeAccountInfoRequestBodyType;

    // * First, check if 'suspended' is present
    if (suspended !== undefined) {
        // Call the service to change the suspended status
        let suspendedService = await changeUserSuspendedStatus(Number(req.params.nif), req.header(FORCE_HEADER)!, suspended);

        // Check if the service was successful
        if (!suspendedService.result) {
            res.status(suspendedService.status).json({message: suspendedService.message});
            return;
        }
    }

    // * Second, check if 'intents' is present
    if (intents !== undefined) {
        // Call the service to change the user permissions
        let intentsService = await changeUserPermissions(Number(req.params.nif), req.header(FORCE_HEADER)!, res.locals.loggedOfficer.nif, intents);

        // Check if the service was successful
        if (!intentsService.result) {
            res.status(intentsService.status).json({message: intentsService.message});
            return;
        }
    }

    res.status(200).json({message: "Account information updated successfully"});
}

export async function deleteAccountController(req: express.Request, res: AccountInfoAPIResponse) {
    // Call the service
    let serviceResult = await deleteUser(res.locals.targetAccount.nif, req.header(FORCE_HEADER)!);

    // Return the result of the service
    res.status(serviceResult.status).json({message: serviceResult.message});
}

export async function resetPasswordController(_req: express.Request, res: AccountInfoAPIResponse) {
    // Call the service
    let serviceResult = await resetUserPassword(res.locals.targetAccount);

    // Return the result of the service
    res.status(serviceResult.status).json({message: serviceResult.message});
}
