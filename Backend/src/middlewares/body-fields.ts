import express from "express";
import {APIResponse} from "../types";
import { RequestError } from "@portalseguranca/api-types";

function assureBodyFields(req: express.Request, res: APIResponse, next: express.NextFunction) {
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

}

export default assureBodyFields;