import {Server} from "socket.io";
import {FORCE_HEADER} from "./constants";
import {logToConsole} from "./logger";
import pc from "picocolors";
import {isSessionValid} from "./session-handler";

export default function setupSocketEvents(ws: Server) {
    // Make sure there is the sessionToken cookie and the force header
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ws.use(async (socket, next) => {
        let {token, force} = socket.handshake.auth;

        // If token is undefined, check if it is present in the cookie
        token ??= socket.handshake.headers.cookie?.split("; ").find((c) => c.startsWith("sessionToken="))?.split("=")[1];

        // If force is undefined, check if it is present in the headers
        force ??= socket.handshake.headers[FORCE_HEADER];

        if (!token) {
            logToConsole(`Socket connection ${socket.id} with no token present`, "warning");
            next(new Error("No token present"));
            return;
        }

        if (!force) {
            logToConsole(`Socket connection ${socket.id} with no force header present`, "warning");
            next(new Error("No force present"));
            return;
        }

        // If the cookie is present, check if it is valid
        // If it is not, disconnect the user
        if (!((await isSessionValid(token as string, force as string)).valid)) {
            logToConsole(`Socket connection ${socket.id} with invalid token`, "warning");
            next(new Error("Unauthorized"));
            return;
        }

        // Make the socket join the room with the force name
        void socket.join(force as string);

        // Make the socket join a room with it's token
        void socket.join(token as string);

        next();
    });

    ws.on("connection", (socket) => {
        logToConsole(`[${pc.whiteBright('WS')}] Socket connection ${socket.id} established`);

        socket.on("disconnect", () => {
            logToConsole(`[${pc.whiteBright('WS')}] Socket connection ${socket.id} disconnected`);
        })
    });
}