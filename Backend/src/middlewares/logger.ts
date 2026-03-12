import express, {NextFunction} from "express";
import {APIResponse} from "../types";
import {colorFromHTTPCode, colorFromMethod, logRequestToFile, logToConsole} from "../utils/logger";
import pc from "picocolors";
import {createAuditLogEntry} from "../api/audit-logs/repository";
import {FORCE_HEADER} from "../utils/constants";
import {MODULE} from "@portalseguranca/api-types";
import {isQueryError} from "./error-handler";
import {QueryError} from "mysql2";

function loggerMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    res.on("finish", () => {
        logToConsole(`[${pc.whiteBright("API")}] [${colorFromMethod(req.method)(req.method)}] ${req.originalUrl.split("api/")[1]} - ${colorFromHTTPCode(res.statusCode)(res.statusCode)}`);

        void logRequestToFile(res);
    });

    next();
}

export function auditLoggerMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    res.on("finish", () => {
        // If the route details are not present, skip it (this only happens if a request to a unexisting route is received)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (res.locals.routeDetails === undefined) return;

        // If the route doesn't have audit log enabled, skip it
        if (res.locals.routeDetails.auditLog === undefined) return;

        // If the status code was 400, 401 or above or equal to 500, don't log it
        if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode >= 500) return;

        // Store user's IP adress
        const userIP = (res.req.header("X-Real-IP") ? res.req.header("X-Real-IP"): res.req.socket.remoteAddress) ?? null;

        // If the request is to change own password, don't log the body
        let body = req.body;
        if (res.locals.routeDetails.auditLog.module === MODULE.ACCOUNTS && res.locals.routeDetails.auditLog.type === "password_change") {
            body = {};
        }

        // Store this change in the database
        void createAuditLogEntry(
            req.header(FORCE_HEADER)!,
            res.locals.loggedOfficer,
            userIP,
            res.locals.routeDetails.auditLog.module,
            res.locals.routeDetails.auditLog.action,
            res.locals.routeDetails.auditLog.type,
            res.locals.routeDetails.auditLog.getTarget ? res.locals.routeDetails.auditLog.getTarget(req, res) : null,
            res.statusCode,
            body,
            res.locals.responseBody as Record<string, unknown>
        ).catch((error: unknown) => {
            logToConsole(pc.red(`Failed to create audit log entry: ${isQueryError(error as Error) ? (error as QueryError).stack : (error as Error).message}\nData: ${JSON.stringify(
                [
                    req.header(FORCE_HEADER)!,
                    res.locals.loggedOfficer,
                    userIP,
                    res.locals.routeDetails.auditLog!.module,
                    res.locals.routeDetails.auditLog!.action,
                    res.locals.routeDetails.auditLog!.type,
                    res.locals.routeDetails.auditLog!.getTarget ? res.locals.routeDetails.auditLog!.getTarget(req, res) : null,
                    res.statusCode,
                    body,
                    res.locals.responseBody
                ]
            )}`));
        });
    });

    next();
}

export default loggerMiddleware;