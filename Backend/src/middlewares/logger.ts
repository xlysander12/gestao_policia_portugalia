import express, {NextFunction} from "express";
import {APIResponse} from "../types";
import {colorFromHTTPCode, colorFromMethod, logRequestToFile, logToConsole} from "../utils/logger";
import pc from "picocolors";
import {createAuditLogEntry} from "../api/audit-logs/repository";
import {FORCE_HEADER} from "../utils/constants";

function loggerMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    res.on("finish", () => {
        logToConsole(`[${pc.whiteBright("API")}] [${colorFromMethod(req.method)(req.method)}] ${req.originalUrl.split("api/")[1]} - ${colorFromHTTPCode(res.statusCode)(res.statusCode)}`);

        void logRequestToFile(res);
    });

    next();
}

export function auditLoggerMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    res.on("finish", () => {
        // If the route doesn't have audit log enabled, skip it
        if (res.locals.routeDetails.auditLog === undefined) return;

        // Store user's IP adress
        const userIP = (res.req.header("X-Real-IP") ? res.req.header("X-Real-IP"): res.req.socket.remoteAddress) ?? null;

        // Store this change in the database
        void createAuditLogEntry(
            req.header(FORCE_HEADER)!,
            res.locals.loggedOfficer,
            userIP,
            res.locals.routeDetails.auditLog.module,
            res.locals.routeDetails.auditLog.action,
            res.locals.routeDetails.auditLog.type,
            res.locals.routeDetails.auditLog.getTarget ? res.locals.routeDetails.auditLog.getTarget(req, res) : undefined,
            res.statusCode,
            req.body
        );
    });

    next();
}

export default loggerMiddleware;