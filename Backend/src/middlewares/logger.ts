import express, {NextFunction} from "express";
import {APIResponse} from "../types";
import {colorFromCode, colorFromMethod, logToConsole} from "../utils/logger";
import pc from "picocolors";

async function loggerMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    res.on("finish", () => {
        logToConsole(`[${pc.whiteBright("API")}] [${colorFromMethod(req.method)(req.method)}] ${req.originalUrl.split("api/")[1]} - ${colorFromCode(res.statusCode)(res.statusCode)}`);
    });

    next();
}

export default loggerMiddleware;