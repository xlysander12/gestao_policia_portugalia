import {APIResponse} from "../../../types";
import {
    ChangeAccountInfoRequestBodyType,
    ChangePasswordRequestBodyType,
    LoginRequestBodyType,
    ValidateTokenRequestBodyType
} from "@portalseguranca/api-types/account/input";
import {FORCE_HEADER} from "../../../utils/constants";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
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
    loginUser,
    validateToken
} from "../services";
import {getAccountForces} from "../services";
import {AccountInfoAPIResponse} from "../../../types/response-types";

export async function validateTokenController (req: express.Request, res: APIResponse): Promise<void> {
    let {intents} = req.body as ValidateTokenRequestBodyType;

    // Call the service
    let isTokenValid = await validateToken(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, intents);

    // Check the result of the service
    if (isTokenValid.result) { // The result was positive, user has requested intents
        res.status(isTokenValid.status).json(<ValidateTokenResponse>{message: isTokenValid.message, data: res.locals.loggedOfficer.nif})
    } else { // The result was negative, user doesn't have requested intents
        res.status(isTokenValid.status).json(<RequestError>{message: isTokenValid.message});
    }

}

export async function getUserAccountDetailsController(req: express.Request, res: AccountInfoAPIResponse): Promise<void> {
    let userDetails = await getUserDetails(res.locals.loggedOfficer.nif, res.locals.targetAccount, req.header(FORCE_HEADER)!);

    if (userDetails.result) {
        res.status(userDetails.status).json(<AccountInfoResponse>{message: userDetails.message, data: userDetails.data});
    } else {
        res.status(userDetails.status).json(<RequestError>{message: userDetails.message});
    }
}

export async function getAccountForcesController(req: express.Request, res: APIResponse) {
    let {nif} = req.params;

    // Call the service
    let serviceResult = await getAccountForces(res.locals.loggedOfficer.nif, Number(nif));

    if (serviceResult.result) {
        res.status(serviceResult.status).json(<UserForcesResponse>{message: "Operação concluída com sucesso", data: {forces: serviceResult.data}});
    } else {
        res.status(serviceResult.status).json(<RequestError>{message: serviceResult.message});
    }
}

export async function loginUserController(req: express.Request, res: APIResponse) {
    const {nif, password, persistent} = req.body as LoginRequestBodyType;

    // Login the user and get the token
    let loginData = await loginUser(nif, password, persistent);

    // If the result of the service was negative, return an error
    if (!loginData.result) {
        res.status(loginData.status).json(<RequestError>{message: loginData.message});
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
    res.status(200).json(<LoginResponse>{
        message: "Operação bem sucedida",
        data: {
            token: loginData.data!.token,
            forces: loginData.data!.forces
        }
    });
}

export async function changeUserPasswordController(req: express.Request, res: APIResponse) {
    const {oldPassword, newPassword, confirmPassword} = req.body as ChangePasswordRequestBodyType;

    const serviceResult = await changeUserPassword(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, oldPassword, newPassword, confirmPassword, req.cookies["sessionToken"] || req.header("Authorization"));

    if (serviceResult.result) {
        res.status(serviceResult.status).json(<RequestSuccess>{message: "Password alterada com sucesso"});
    } else {
        res.status(serviceResult.status).json(<RequestError>{message: serviceResult.message});
    }
}

export async function createAccountController(req: express.Request, res: APIResponse) {
    const {nif} = req.params;

    // Call the service
    let serviceResult = await createAccount(Number(nif), req.header(FORCE_HEADER)!);

    // Check the result of the service
    if (serviceResult.result) {
        res.status(serviceResult.status).json(<RequestSuccess>{message: "Conta criada com sucesso"});
    } else {
        res.status(serviceResult.status).json(<RequestError>{message: serviceResult.message});
    }
}

export async function changeAccountDetailsController(req: express.Request, res: APIResponse) {
    const {suspended, intents} = req.body as ChangeAccountInfoRequestBodyType;

    // * First, check if 'suspended' is present
    if (suspended !== undefined) {
        // Call the service to change the suspended status
        let suspendedService = await changeUserSuspendedStatus(Number(req.params.nif), req.header(FORCE_HEADER)!, suspended);

        // Check if the service was successful
        if (!suspendedService.result) {
            res.status(suspendedService.status).json(<RequestError>{message: suspendedService.message});
            return;
        }
    }

    // * Second, check if 'intents' is present
    if (intents !== undefined) {
        // Call the service to change the user permissions
        let intentsService = await changeUserPermissions(Number(req.params.nif), req.header(FORCE_HEADER)!, res.locals.loggedOfficer.nif, intents);

        // Check if the service was successful
        if (!intentsService.result) {
            res.status(intentsService.status).json(<RequestError>{message: intentsService.message});
            return;
        }
    }

    res.status(200).json(<RequestSuccess>{message: "Account information updated successfully"});
}

export async function deleteAccountController(req: express.Request, res: AccountInfoAPIResponse) {
    // Call the service
    let serviceResult = await deleteUser(res.locals.targetAccount.nif, req.header(FORCE_HEADER)!);

    // Check the result of the service
    if (serviceResult.result) {
        res.status(200).json(<RequestSuccess>{message: "Conta eliminada com sucesso"});
    } else {
        res.status(serviceResult.status).json(<RequestError>{message: serviceResult.message});
    }
}