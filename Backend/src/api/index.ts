import express from 'express';
import utilRoutes from "./util/util";
import metricsRoutes from "./metrics/metrics";
import accountRoutes from "./accounts";
import officerInfoRoutes from "./officers/officers";
import {
    FORCE_HEADER
} from "../utils/constants";
import {
    isTokenValid,
    updateLastTimeTokenUsed,
    updateLastTimeUserInteracted,
    userHasIntents
} from "../utils/user-handler";
import routes, {methodType} from "./routes";
import {RequestError} from "@portalseguranca/api-types";
import {getForcesList} from "../utils/config-handler";

const apiRoutes = express.Router();

// Middleware to gather the route's information from the routes object
apiRoutes.use((req, res, next) => {
    // Check if the requested route is present in the routes object
    // The keys of this object, are RegEx that match the routes
    const routeIndex = Object.keys(routes).findIndex((route) => new RegExp(route).test(req.path));

    // If the route is not present, assume no validation is needed
    if (routeIndex === -1) {
        res.locals.routeDetails = null;
        return next();
    }

    // Get the route object
    const route = routes[Object.keys(routes)[routeIndex]];

    // * Check if the used method is present in the route object
    // Cast the method to the required type
    const method = req.method as methodType;

    // If the method is not present, assume no validation is needed
    if (route.methods[method] === undefined) {
        res.locals.routeDetails = null;
        return next();
    }

    // Since the method is present, store the values in locals and proceed to the next middleware
    res.locals.routeDetails = route.methods[method];
    next();
});

/**
 * Middleware to check if the request has basic necessary information
 * This includes:
 * - If the route requires a force, check if the force is present and valid
 * - If the route requires a token, check if the token is present and valid
 * - If the route requires intents, check if the user has the required intents
 */
apiRoutes.use(async (req, res, next) => {
    // First, check if the route object is present
    if (res.locals.routeDetails === null || res.locals.routeDetails === undefined) { // Since it's not present, assume no validation is needed
        return next();
    }

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
    if (res.locals.routeDetails.requiresToken) {
        // Since it requires a token, check if the token is present
        if (req.header("authorization") === undefined && req.cookies["sessionToken"] === undefined) { // If it requires a token, but it's not present, return 400
            let response: RequestError = {
                message: "Autenticação inválida"
            }

            res.status(401).json(response);
            return;
        }

        // Check if the token is valid
        const tokenValidity = await isTokenValid(req.header("authorization") || req.cookies["sessionToken"], req.header(FORCE_HEADER));
        if (!tokenValidity[0]) { // If the token is not valid, return 400
            let response: RequestError = {
                message: "Autenticação inválida"
            }

            res.status(tokenValidity[1]).json(response);
            return;
        }

        // * Since the token is valid, update the last time the token was used and the last time the user interacted
        res.locals.user = Number(tokenValidity[2]); // Store the user's NIF in locals
        // Update the last time the token was used
        updateLastTimeTokenUsed(req.header("authorization") || req.cookies["sessionToken"]).then(); // No need to wait for this to finish
        // Update the last time the user has interacted
        updateLastTimeUserInteracted(res.locals.user).then(); // No need to wait for this to finish

        // * Check if the route requires intents
        if (res.locals.routeDetails.intents && res.locals.routeDetails.intents.length > 0) {
            // Check if the user has the required intents
            let hasIntents = true;

            // Check all the intents present in the route
            for (const intent of res.locals.routeDetails.intents) {
                // If the user doesn't have all the required intents, assume they can't access the route
                if (!(await userHasIntents(res.locals.user, req.header(FORCE_HEADER), intent))) {
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
});

// Middleware to check if the request has all the fields valid
apiRoutes.use((req, res, next) => {
    //  Check if the route details are present. If not, assume no validation is needed
    if (res.locals.routeDetails === null) {
        return next();
    }

    // Check if the route has a body pattern
    if (!res.locals.routeDetails.body) { // If it doesn't have a body pattern, assume no validation is needed
        return next();
    }

    // Since the route has a body pattern, check if the contents of the request's body are valid
    const validation = res.locals.routeDetails.body.type.validate(req.body);

    if (!validation.success) {
        let response: RequestError = {
            message: "Corpo do pedido inválido"
        }

        res.status(400).json(response);
        return;
    }

    // If the body is valid, continue to the next middleware
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

console.log("[Portal Segurança] API routes loaded successfully.");

export default apiRoutes;