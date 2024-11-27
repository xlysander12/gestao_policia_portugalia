import {APIResponse} from "../../../types";
import {ValidateTokenRequestBodyType} from "@portalseguranca/api-types/account/input";
import {FORCE_HEADER} from "../../../utils/constants";
import {RequestError} from "@portalseguranca/api-types";
import {AccountInfoResponse, ValidateTokenResponse} from "@portalseguranca/api-types/account/output";
import express from "express";
import {getUserDetails, validateToken} from "../services";

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