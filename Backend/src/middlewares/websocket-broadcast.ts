import express, { NextFunction } from "express";
import { APIResponse } from "src/types";
import {FORCE_HEADER} from "../utils/constants";
import {getForcePatrolForces} from "../utils/config-handler";
import {logToConsole} from "../utils/logger";
import pc from "picocolors";

export async function websocketBroadcastMiddleware(req: express.Request, res: APIResponse, next: NextFunction) {
    // Check if there is a broadcast key in the route object
    if (res.locals.routeDetails.broadcast) {
        // If there is, create an event handler to broadcast the message to the clients when the response is sent
        res.on("finish", () => {
            if (res.locals.ws && req.header(FORCE_HEADER) && res.statusCode < 400) {
                // Build the message body
                const body = res.locals.routeDetails.broadcast!.body(req, res);

                res.locals.ws.to(req.header(FORCE_HEADER)!).emit(res.locals.routeDetails.broadcast!.event, body);

                // Log this broadcast to the console
                logToConsole(`[${pc.whiteBright("WS")}] [${pc.white(req.header(FORCE_HEADER)!.toUpperCase())}] [${pc.green(res.locals.routeDetails.broadcast!.event)}] ${JSON.stringify(body)}`);

                // If the patrols flag is set to true, broadcast the message to all patrol forces of the current force
                if (res.locals.routeDetails.broadcast!.patrol) {
                    for (const force of getForcePatrolForces(req.header(FORCE_HEADER)!)) {
                        res.locals.ws.to(force).emit(res.locals.routeDetails.broadcast!.event, body);
                    }
                }
            }
        });
    }

    next();
}