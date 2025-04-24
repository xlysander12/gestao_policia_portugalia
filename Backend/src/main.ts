// Importing basic libraries
import express, {Router} from "express";
import serveIndex from "serve-index";

// Load the config file
import {getForcesList, loadConfig} from "./utils/config-handler";
loadConfig();

// Initialize the log file
import {initializeLogFile, logToConsole} from "./utils/logger";
initializeLogFile();

import apiRoutes from "./api";
import {queryDB} from "./utils/db-connector";
import {isTokenValid} from "./api/accounts/repository";
import {join} from "path";

const app = Router(); // This app is a router to compartimentalize routes


// * React Static
app.use(express.static(join(__dirname, "..", "..", "Frontend", "dist")));

// * Import the API routes
app.use("/api", apiRoutes);

// * Database backup files
app.use("/db", async (req, res, next) => {
    // Check if the user is authenticated and has the right patent
    let loggedUser: {valid: boolean, status: number, nif?: number, force: string} = {
        valid: false,
        status: 0,
        force: ""
    };

    for (const force of getForcesList()) {
        const isValid = await isTokenValid(req.cookies.sessionToken, force);
        if (isValid.valid) {
            loggedUser = {...isValid, force: force};
            break;
        }
    }

    if (!loggedUser.valid) { // Token is invalid
        res.status(401).send("Unauthorized");
        return;
    }

    // * Check if the user has the right patent
    const loggedNif = loggedUser.nif;

    // Fecth patent from database
    const result = await queryDB(loggedUser.force, "SELECT patent FROM officers WHERE nif = ?", loggedNif);

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
app.get(/\/.*/, (_req, res) => {
    res.sendFile(join(__dirname, "..", "..", "Frontend", "dist", "index.html"));
});


export default app;

logToConsole("Portal Segurança has been fully loaded!", "info");