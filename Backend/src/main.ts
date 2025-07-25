// Importing basic libraries
import express, {Router} from "express";
import serveIndex from "serve-index";

// Load the config file
import {getDatabaseDetails, getForcesList, loadConfig} from "./utils/config-handler";
loadConfig();

// Initialize the log file
import {initializeLogFile, logToConsole} from "./utils/logger";
initializeLogFile();

import apiRoutes from "./api";
import {queryDB} from "./utils/db-connector";
import {join} from "path";
import {isSessionValid} from "./utils/session-handler";

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
        const isValid = await isSessionValid(req.cookies.sid, force);
        if (isValid.valid) {
            loggedUser = {...isValid, force: force};
            break;
        }
    }

    // Session is invalid, AKA, doesn't exit
    // Redirect to the login screen
    if (!loggedUser.valid) {
        res.redirect("/portugalia/portalseguranca/login?redirect=/db");
        return;
    }

    // * Check if the user is in the "allowed_users" list of the database
    const loggedNif = loggedUser.nif!;

    // Fetch the database details
    const db_details = getDatabaseDetails();
    if (!db_details.allowed_users?.includes(loggedNif)) {
        res.status(403).redirect("/portugalia/portalseguranca");
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