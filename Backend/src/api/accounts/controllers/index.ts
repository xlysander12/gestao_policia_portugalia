import {APIResponse} from "../../../types";
import {LoginRequestBodyType, ValidateTokenRequestBodyType} from "@portalseguranca/api-types/account/input";
import {FORCE_HEADER} from "../../../utils/constants";
import {RequestError} from "@portalseguranca/api-types";
import {
    AccountInfoResponse, LoginResponse,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/account/output";
import express, {CookieOptions} from "express";
import {getUserDetails, loginUser, validateToken} from "../services";
import {getAccountForces} from "../services";

export async function validateTokenController (req: express.Request, res: APIResponse): Promise<void> {
    let {intents} = req.body as ValidateTokenRequestBodyType;

    // Call the service
    let isTokenValid = await validateToken(res.locals.user!, req.header(FORCE_HEADER)!, intents);

    // Check the result of the service
    if (isTokenValid.result) { // The result was positive, user has requested intents
        res.status(isTokenValid.status).json(<ValidateTokenResponse>{message: isTokenValid.message, data: Number(res.locals.user)})
    } else { // The result was negative, user doesn't have requested intents
        res.status(isTokenValid.status).json(<RequestError>{message: isTokenValid.message});
    }

}

export async function getUserAccountDetailsController(req: express.Request, res: APIResponse): Promise<void> {
    let {nif} = req.params;

    let userDetails = await getUserDetails(res.locals.user!, Number(nif), req.header(FORCE_HEADER)!);

    if (userDetails.result) {
        res.status(userDetails.status).json(<AccountInfoResponse>{message: userDetails.message, data: userDetails.data});
    } else {
        res.status(userDetails.status).json(<RequestError>{message: userDetails.message});
    }
}

export async function getAccountForcesController(req: express.Request, res: APIResponse) {
    let {nif} = req.params;

    // Call the service
    let serviceResult = await getAccountForces(res.locals.user!, Number(nif));

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