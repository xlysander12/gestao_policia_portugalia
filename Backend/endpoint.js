// Importing necessary modules
const express = require("express");
const app = express.Router(); // This app is a router to compartimentalize routes
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const dotenv = require("dotenv");

// Initialize dotenv
dotenv.config({path: __dirname + "\\.env"});


// Import MySQL connection configurations
const dbConfigDefaultPSP = require("./dbConfigDefaultPSP");

// Create MySQL Pools
const poolDefaultPSP = mysql.createPool(dbConfigDefaultPSP);

// Storing Tokens List
const authenticatedTokens = {"dev": 668855471};

/************************************
 * Token / Authentication Functions *
 ***********************************/

function generateToken(username) {
    // Before generating a token, seek and revoke all tokens from the user
    for (let token in authenticatedTokens) {
        if (authenticatedTokens[token] === username) {
            delete authenticatedTokens[token];
        }
    }

    // Generate a random token
    let token = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 32; i++) {
        token += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    // After generating the token, check if it already exists
    if (authenticatedTokens[token]) {
        // If it already exists, generate another one
        return generateToken();
    }

    // If it doesn't exist, store it in authenticatedTokens and return it
    authenticatedTokens[token] = username;
    return token;
}

async function checkTokenValidityIntents(token, intent) {
    // Check if the token is present
    if (token === undefined) {
        return [false, 401];
    }

    // Check if the token exists
    if (!authenticatedTokens[token]) {
        return [false, 401];
    }

    // If intent is null, then the user doesn't need special permissions
    if (intent === null) {
        return [true, 0]; // Since the return was true, no HTTT Status Code is needed
    }

    // Fetch the database the intents json of the user
    const [rows, fields] = await poolDefaultPSP.query(`SELECT intents FROM usuarios WHERE username = ${authenticatedTokens[token]}`);

    if (rows.length === 0) {
        return [false, 500];
    }

    // Converting the row to a JSON object
    let userIntents = JSON.parse(rows[0].intents);

    // Check if the user has the intent
    if (userIntents[intent]) {
        return [true, 200];
    }

    return [false, 403];

}

/********************************
 * Routes to serve the frontend *
 *******************************/
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../Frontend/home/index.html"));
});

// Setting up the default login page route
app.get("/login", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../Frontend/login/index.html"));
});


/***************
 * API Routes *
 *************/

/**
 * Login endpoint
 **/

// Post Endpoint to login
app.post("/api/login", async (req, res) => {
    // Check if the request has the correct body
    if (!req.body.username || !req.body.password) {
        res.status(400).send(); // TODO: Send JSON with error message
        return;
    }

    // Check if the user exists
    const [rows, fields] = await poolDefaultPSP.query(`SELECT password FROM usuarios WHERE username = ${req.body.username}`);

    if (rows.length === 0) {
        res.status(401).send(); // TODO: Send JSON with error message
        return;
    }

    // If the password is NULL, then the correct password would be "seguranca"
    if (rows[0].password === null) {
        if (req.body.password !== "seguranca") {
            res.status(401).send(); // TODO: Send JSON with error message
            return;
        }

        // If everything is correct, generate a token and store it in the authenticatedTokens list
        let token = generateToken(req.body.username);

        // Send the token to the user
        res.status(200).send(token); // TODO: Send JSON with token
        return;
    }

    // If the password is not NULL, check if it is correct
    if (rows[0].password !== req.body.password) { // TODO: Hash the password
        res.status(401); // TODO: Send JSON with error message
        return;
    }

    // If everything is correct, generate a token and store it in the authenticatedTokens list
    let token = generateToken(req.body.username);

    // Send the token to the user
    res.status(200).send(token); // TODO: Send JSON with token
});

// Patch Endpoint to change password
app.patch("/api/login", (req, res) => {
    // TODO: Implement this endpoint
});

/**
 * Officer Information endpoint
 **/
app.get("/api/officerInfo", async (req, res) => {
    // Check if user is authenticated and if it has the correct intent to access this endpoint
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization);
    if (!authenticatedPermission[0]) {
        res.status(authenticatedPermission[1]).send(); // TODO: Send JSON with error message
        return;
    }

    // If there's no search defined, replace with empty string
    if (req.query.search === undefined) {
        req.query.search = "";
    }

    const [rows, fields] = await poolDefaultPSP.query(`SELECT * FROM agentes WHERE CONCAT(nome, callsign, nif, discord) LIKE "%${req.query.search}%"`);
    res.status(200).send(rows); // TODO: Send JSON with officer info
});

module.exports = app;