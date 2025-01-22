import express from "express";
import {APIResponse} from "../types";
import { RequestError } from "@portalseguranca/api-types";
import {routeMethodType} from "../api/routes";
import {requestQueryToReceivedQueryParams, ReceivedQueryParams} from "../utils/filters";

function assureBodyTypes(routeDetails: routeMethodType, body: any): [boolean, string, string] {
    // Since the route has a body pattern, check if the contents of the request's body are valid
    const validation = routeDetails.body!.type.validate(body);

    if (!validation.success) {
        return [false, "Corpo do pedido inválido", validation.message];
    }

    return [true, "", ""];
}

function assureQueryTypes(routeDetails: routeMethodType, query: ReceivedQueryParams): [boolean, string, string] {
    // Since the route has a body pattern, check if the contents of the request's body are valid
    const validation = routeDetails.queryParams!.type.validate(query);

    if (!validation.success) {
        return [false, "Parâmetros inválidos", validation.message];
    }

    return [true, "", ""];
}

function assureRequestTypes(req: express.Request, res: APIResponse, next: express.NextFunction) {
    // Check if the route has a body pattern
    if (res.locals.routeDetails.body) { // If it has a body pattern, validate it to make sure the request is valid
        const [success, message, details] = assureBodyTypes(res.locals.routeDetails, req.body);

        if (!success) {
            let response: RequestError = {
                message: message,
                details: details
            }

            res.status(400).json(response);
            return;
        }
    }

    // Add the query params to the locals
    const receivedQueryParams = requestQueryToReceivedQueryParams(req.query);
    res.locals.queryParams = receivedQueryParams;

    // Check if the route has a params entry
    if (res.locals.routeDetails.queryParams) { // If it has a queryParms pattern, validate it to make sure the request is valid
        // Make sure the request has been sent with any query params
        // If the request has no query params, skip this step
        if (Object.keys(req.query).length === 0) {
            next();
            return;
        }

        const [success, message, details] = assureQueryTypes(res.locals.routeDetails, receivedQueryParams);

        if (!success) {
            let response: RequestError = {
                message: message,
                details: details
            }

            res.status(400).json(response);
            return;
        }
    }

    // If the body is valid, continue to the next middleware
    next();

}

export default assureRequestTypes;