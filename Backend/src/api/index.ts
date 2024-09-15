import express from 'express';
import utilRoutes from "./util/util";
import metricsRoutes from "./metrics/metrics";
import accountRoutes from "./accounts";
import officerInfoRoutes from "./officers/officers";
import {
    FORCES,
    INTENT_REQUIRED_ROUTES,
    IntentRequiredRoute,
    NO_FORCE_REQUIRED_ROUTES,
    NO_TOKEN_REQUIRED_ROUTES
} from "../utils/constants";
import {
    isTokenValid,
    updateLastTimeTokenUsed,
    updateLastTimeUserInteracted,
    userHasIntents
} from "../utils/user-handler";
import {RequestError} from "@portalseguranca/api-types/api/schema";

export const apiRoutes = express.Router();

function isRouteExcluded(route: string, method: string, exclude: (string | RegExp)[][]): boolean {
    // Go through all the regex entries and check if the route is excluded
    for (const entry of exclude) {
        // Check if the route matches the regex
        if ((entry[0] as RegExp).test(route)) {
            // If it matches, check if the method is also excluded
            // Since 'entry[1]' can be another array of methods, check if the method is in the array
            if (Array.isArray(entry[1])) {
                // If it is an array, check if the method is in the array
                return (entry[1] as string[]).includes(method);
            }
            // If it's not an array, check if it is a wildcard ('*') or the method itself
            return entry[1] === "*" || entry[1] === method;
        }
    }

    // If the path is not in the exclude list, return false
    return false;
}

function routeNeedsIntents(route: string, method: string, routes: IntentRequiredRoute[]): (boolean | IntentRequiredRoute)[] | boolean {
    // Go through all the regex entries and check if the route needs intents
    for (const entry of routes) {
        // Check if the route matches the regex
        if (entry.route.test(route)) {
            // If it matches, check if the method requires intents
            // Since 'entry[1]' can be an array of methods, check if the method is in the array
            if (Array.isArray(entry.methods)) { // If it is an array, check if the method is in the array
                if ((entry.methods as string[]).includes(method)) {
                    // If the method is in the array, return true and the entry
                    return [true, entry];
                }
            }
            // If it's not an array, check if it is a wildcard ('*') or the method itself
            if (entry.methods === "*" || entry.methods === method) {
                // If the method needs intents, return true and the entry
                return [true, entry];
            }
        }
    }

    // If the path is not in the exclude list, return false
    return false;
}

// Middleware to check if the request has basic necessary information
apiRoutes.use(async (req, res, next) => {
    // Check if this request needs a token, if not, skip the token check
    if (!isRouteExcluded(req.path, req.method, NO_TOKEN_REQUIRED_ROUTES)) {
        // Since it needs a token, check if a valid token is given
        const validation = await isTokenValid(req.header("authorization") || req.cookies["sessionToken"], req.header("x-portalseguranca-force"));

        // The first entry of validation will always be a boolean
        if (!(validation[0] as boolean)) {
            let response: RequestError = {message: "Autenticação inválida"} // Default response

            // If the token is not valid, check if it is because of the token itself or the force
            if (validation[1] === 401) { // If the code is 401, the token itself is invalid for that force or hasn't been given
                response = {
                    message: "O token fornecido é inválido"
                }
            } else if (validation[1] === 400) { // If the code is 400, there is no force present in the request
                response = {
                    message: "Não foi fornecida uma força"
                }
            }

            res.status(validation[1] as number).json(response);
            return;
        }

        // Since the token is valid, add an header with the user that is making this request
        res.locals.user = validation[2];

        // Since the request needs a token, there's a possibility it also needs an intent
        // Given this, check if the route is one that needs intents and, if so, check if the user has said intent
        let needsIntent = routeNeedsIntents(req.path, req.method, INTENT_REQUIRED_ROUTES);
        const isIntentRequired = Array.isArray(needsIntent) ? needsIntent[0] : needsIntent;

        if (isIntentRequired) { // Check if an intent is needed
            needsIntent = needsIntent as (boolean | IntentRequiredRoute)[];
            const intent = needsIntent[1] as IntentRequiredRoute;
            const hasIntent = await userHasIntents(validation[2], req.header("x-portalseguranca-force"), intent.intents);

            if (!hasIntent) {
                let response: RequestError = {message: "Não tens permissão para efetuar esta ação"}
                res.status(403).json(response);
                return;
            }
        }

    } else { // Every request that needs a token, also needs a force, so if the token is necessary, the force is also necessary
        // Check if this request needs a force, if not, skip the force check
        if (!isRouteExcluded(req.path, req.method, NO_FORCE_REQUIRED_ROUTES)) {
            // Since it needs a force check, check it
            const force = req.header("x-portalseguranca-force");
            let response: RequestError = {message: "Força inválida"} // Default response

            if (force === undefined) {
                response = {
                    message: "É necessária uma força para a realização deste pedido"
                }

                res.status(400).json(response);
                return;
            }

            // Check if the force is valid
            if (!FORCES.includes(force)) {
                response = {
                    message: "A força fornecida é inválida"
                }
                res.status(400).json(response);
                return;
            }
        }
    }

    // * If all conditionals pass, continue to the next middleware since the authentication of the request is valid
    // Update the last time the token was used
    await updateLastTimeTokenUsed(req.header("authorization") || req.cookies["sessionToken"]);
    // Update the last time the user has interacted
    await updateLastTimeUserInteracted(res.locals.user);

    // Continue to next middleware
    next();
});

// Import util routes
apiRoutes.use("/util", utilRoutes);

// Import metrics routes
apiRoutes.use("/metrics", metricsRoutes);

// Import accounts routes
apiRoutes.use("/accounts", accountRoutes);

// Import Officer Info routes
apiRoutes.use("/officers", officerInfoRoutes)

console.log("[Portal Segurança] API routes loaded successfully.")