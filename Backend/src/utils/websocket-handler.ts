import {Server} from "socket.io";
import {isTokenValid} from "../api/accounts/repository";
import {FORCE_HEADER} from "./constants";
import {logToConsole} from "./logger";
import pc from "picocolors";

export default function setupSocketEvents(ws: Server) {
    // Make sure there is the sessionToken cookie and the force header
    ws.use(async (socket, next) => {
        let {token, force} = socket.handshake.auth;

        // If token is undefined, check if it is present in the cookie
        if (!token) {
            token = socket.handshake.headers.cookie?.split("; ").find((c) => c.startsWith("sessionToken="))?.split("=")[1];
        }

        // If force is undefined, check if it is present in the headers
        if (!force) {
            force = socket.handshake.headers[FORCE_HEADER];
        }

        if (!token) {
            logToConsole(`Socket connection ${socket.id} with no token present`, "warning");
            return next(new Error("No token present"));
        }

        if (!force) {
            logToConsole(`Socket connection ${socket.id} with no force header present`, "warning");
            return next(new Error("No force present"));
        }

        // If the cookie is present, check if it is valid
        // If it is not, disconnect the user
        if (!(await isTokenValid(token, force))) {
            logToConsole(`Socket connection ${socket.id} with invalid token`, "warning");
            return next(new Error("Unauthorized"));
        }

        // Make the socket join the room with the force name
        socket.join(force);

        next();
    });

    ws.on("connection", async (socket) => {
        logToConsole(`[${pc.whiteBright('WS')}] Socket connection ${socket.id} established`);

        socket.on("disconnect", () => {
            logToConsole(`[${pc.whiteBright('WS')}] Socket connection ${socket.id} disconnected`);
        })
    });
}