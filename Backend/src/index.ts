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

// Ensure all required environment variables are set
import {requiredEnvVarsExist} from "./utils/required-env";
requiredEnvVarsExist();

// Ensure all required files exist
import {requiredFilesExist} from "./utils/required-env";
requiredFilesExist();

// Load routes
import endpoint from "./main";
import {ExpressResponse} from "./types/response-types";
import setupSocketEvents from "./utils/websocket-handler";

// Create the app
const app = express();

// Create the http server
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const httpServer = http.createServer(app);

// Set timeout to 30 seconds
httpServer.setTimeout(60 * 1000);

// Initialize the socket
const ws = new Server(httpServer, {
    path: "/portugalia/portalseguranca/ws",
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
});

// Configure the websocket
setupSocketEvents(ws);

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

httpServer.listen(process.env.HTTP_PORT, () => {
   logToConsole(`Server started on port ${process.env.HTTP_PORT}`, "info");
});
