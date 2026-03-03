import express from "express";
import {APIResponse} from "../types";

function storeResponse(req: express.Request, res: APIResponse, next: express.NextFunction) {
    const originalJson = res.json;

    res.json = function (body) {
        res.locals.responseBody = body;

        return originalJson.call(this, body);
    };

    next();
}

export default storeResponse;