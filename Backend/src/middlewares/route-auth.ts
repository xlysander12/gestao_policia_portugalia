import { RequestError } from "@portalseguranca/api-types";
import {FORCE_HEADER} from "../utils/constants";
import {getForcesList} from "../utils/config-handler";
import {
    isTokenValid,
    updateLastTimeTokenUsed,
    updateLastTimeUserInteracted,
    userHasIntents
} from "../api/accounts/repository";
import express, {NextFunction} from "express";
import {APIResponse, InnerOfficerData} from "../types";
import {getOfficerData} from "../api/officers/repository";

/**
 * Middleware to check if the request has basic necessary information
 * This includes:
 * - If the route requires a force, check if the force is present and valid
 * - If the route requires a token, check if the token is present and valid
 * - If the route requires intents, check if the user has the required intents
 */
async function assureRouteAuth(req: express.Request, res: APIResponse, next: NextFunction) {
    // * Checking the required basic information for the request
    // Check if this route requires a force header
    if (res.locals.routeDetails.requiresForce) {
        // Since it requires a force, check if the force is present
        if (req.header(FORCE_HEADER) === undefined) { // If it requires a force, but it's not present, return 400
            let response: RequestError = {
                message: "É necessária uma força para a realização deste pedido"
            }

            res.status(400).json(response);
            return;
        }

        // Check if the force is valid
        if (!getForcesList().includes(req.header(FORCE_HEADER)!)) { // If the force is not valid, return 400
            let response: RequestError = {
                message: "Força inválida"
            }

            res.status(400).json(response);
            return;
        }

    }

    // Check if this route requires a token
    const sessionToken: string | undefined = req.header("authorization") || req.cookies["sessionToken"];
    if (res.locals.routeDetails.requiresToken) {
        // Since it requires a token, check if the token is present
        if (!sessionToken) { // If it requires a token, but it's not present, return 400
            let response: RequestError = {
                message: "Autenticação inválida"
            }

            res.status(401).json(response);
            return;
        }

        // Check if the token is valid
        const tokenValidity = await isTokenValid(sessionToken, req.header(FORCE_HEADER));
        if (!tokenValidity.valid) { // If the token is not valid, return 400
            let response: RequestError = {
                message: "Autenticação inválida"
            }

            res.status(tokenValidity.status).json(response);
            return;
        }

        // * Since the token is valid, update the last time the token was used and the last time the user interacted
        res.locals.loggedOfficer = ((await getOfficerData(tokenValidity.nif!, req.header(FORCE_HEADER)!))! as InnerOfficerData); // Store the user's information in locals
        // Update the last time the token was used
        updateLastTimeTokenUsed(sessionToken).then(); // No need to wait for this to finish
        // Update the last time the user has interacted
        updateLastTimeUserInteracted(res.locals.loggedOfficer.nif).then(); // No need to wait for this to finish

        // * Check if the route requires intents
        if (res.locals.routeDetails.intents && res.locals.routeDetails.intents.length > 0) {
            // Check if the user has the required intents
            let hasIntents = true;

            // Check all the intents present in the route
            for (const intent of res.locals.routeDetails.intents) {
                // If the user doesn't have all the required intents, assume they can't access the route
                if (!(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, intent))) {
                    hasIntents = false;
                    break;
                }
            }

            if (!hasIntents) { // If the user doesn't have the required intents, return 403
                let response: RequestError = {
                    message: "Não tem permissões suficientes para realizar este pedido"
                }

                res.status(403).json(response);
                return;
            }
        }
    }

    // If all conditionals pass, continue to the next middleware since the authentication of the request is valid
    next();
}

export default assureRouteAuth;