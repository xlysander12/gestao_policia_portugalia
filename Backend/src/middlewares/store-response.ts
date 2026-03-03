import express from "express";
import {APIResponse} from "../types";

function storeResponse(req: express.Request, res: APIResponse, next: express.NextFunction) {
    const originalSend = res.send;

    res.send = function (body) {
        res.locals.responseBody = body;

        return originalSend.call(this, body);
    };

    next();
}

export default storeResponse;