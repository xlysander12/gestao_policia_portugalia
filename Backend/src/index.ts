import express from 'express';
import http from 'http';
import {Server} from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

// Load .env file
import {config} from "dotenv";
import {join} from "path";
import {logToConsole} from "./utils/logger";
config({path: join(__dirname, "..", ".env")});

// Load routes
import endpoint from "./main";
import {ExpressResponse} from "./types/response-types";

// Create the app
const app = express();

// Create the http server
const httpServer = http.createServer(app);

// Set timeout to 30 seconds
httpServer.setTimeout(30 * 1000);

// Initialize the socket
const ws = new Server(httpServer);

ws.on("connection", (socket) => {
    logToConsole(`Socket connected: ${socket.id}`, "info");

    socket.on("disconnect", () => {
        logToConsole(`Socket disconnected: ${socket.id}`, "info");
    });
});

// * Most basic Middleware
// Cors
app.use(cors());

// Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Cookies Parser
app.use(cookieParser());

// Include the socket in the locals
app.use((_req, res: ExpressResponse, next) => {
    res.locals.ws = ws;
    next();
});

// Include all routes
app.use("/portugalia/portalseguranca", endpoint);

httpServer.listen(process.env["PS_HTTP_PORT"], () => {
   logToConsole(`Server started on port ${process.env["PS_HTTP_PORT"]}`, "info");
});
