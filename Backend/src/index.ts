// Importing basic libraries
import express, {Router} from "express";
import bodyParser from "body-parser"
import cookieParser from "cookie-parser";
import serveIndex from "serve-index";
// Load .env file
import {config} from "dotenv";
import {join} from "path";
config({path: join(__dirname, "..", ".env")});

import apiRoutes from "./api";
import {isTokenValid} from "./utils/user-handler";
import {queryDB} from "./utils/db-connector";
import {FORCES} from "./utils/constants";

const app = Router(); // This app is a router to compartimentalize routes

// TODO: Make sure every environment variable is set. If not, don't let the code run

// * Most basic Middleware
// Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// Cookies Parser
app.use(cookieParser());

// React Static
app.use(express.static(join(__dirname, "..", "..", "Frontend", "dist")));

// Import the API routes
app.use("/api", apiRoutes);

// Database backup files
app.use("/db", async (req, res, next) => {
    // Check if the user is authenticated and has the right patent
    let loggedUser = [false, "", "", ""];
    for (const force of FORCES) {
        const isValid = await isTokenValid(req.cookies["sessionToken"], force);
        if (isValid[0]) {
            loggedUser = isValid;
            loggedUser[3] = force;
            break;
        }
    }

    if (!loggedUser[0]) { // Token is invalid
        res.status(401).send("Unauthorized");
        return;
    }

    // * Check if the user has the right patent
    const loggedNif = loggedUser[2];

    // Fecth patent from database
    const result = await queryDB(loggedUser[3], "SELECT patent FROM officers WHERE nif = ?", loggedNif);

    // Check if the patent is valid
    if (result.length === 0) {
        res.status(401).send("Unauthorized");
        return;
    }

    // Check if the user has the right patent
    // TODO: This needs to use an intent, not a patent
    if (result[0].patent < 9) {
        res.status(403).send("Forbidden");
        return;
    }

    next();
}, express.static(join(__dirname, "..", "..", "Database")), serveIndex(join(__dirname, "..", "..", "Database"), {icons: true, view: "details"}));

// React Build
app.get("/*", (req, res) => {
    res.sendFile(join(__dirname, "..", "..", "Frontend", "dist", "index.html"));
});


export default app;

console.log("[Portal Segurança] Portal Segurança has been fully loaded!")