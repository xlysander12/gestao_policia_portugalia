import express, {NextFunction} from "express";
import {APIResponse} from "../types";
import {colorFromHTTPCode, colorFromMethod, logRequestToFile, logToConsole} from "../utils/logger";
import pc from "picocolors";

function loggerMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    res.on("finish", () => {
        logToConsole(`[${pc.whiteBright("API")}] [${colorFromMethod(req.method)(req.method)}] ${req.originalUrl.split("api/")[1]} - ${colorFromHTTPCode(res.statusCode)(res.statusCode)}`);

        void logRequestToFile(res);
    });

    next();
}

export default loggerMiddleware;