import express from 'express';
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

// Create the app
const app = express();

// * Most basic Middleware
// Cors
app.use(cors());

// Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Cookies Parser
app.use(cookieParser());

// Include all routes
app.use("/portugalia/portalseguranca", endpoint);

app.listen(process.env["PS_HTTP_PORT"], () => {
   logToConsole(`Server started on port ${process.env["PS_HTTP_PORT"]}`, "info");
});
