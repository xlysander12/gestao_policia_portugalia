// Importing necessary modules
const express = require("express");
const app = express.Router(); // This app is a router to compartimentalize routes
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const dotenv = require("dotenv");

// Initialize dotenv
dotenv.config();


// Import MySQL connection configurations
const dbConfigDefaultPSP = require("./dbConfigDefaultPSP");

// Create MySQL Pools
const poolDefaultPSP = mysql.createPool(dbConfigDefaultPSP);

// Storing Tokens List
const authenticatedTokens = {};

app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../Frontend/home/index.html"));
});

// Setting up the default login page route
app.get("/login", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../Frontend/login/index.html"));
});


/****
 * Now messing with actual REST API
 *****/

// Getting officer information from the database
app.get("/api/officerInfo", async (req, res) => {
    // First check if the user is authenticated
    // if (!authenticatedTokens[req.headers.authorization]) {
    //     res.status(401); // TODO: Send JSON with error message
    //     return;
    // }

    // If there's no search defined, replace with empty string
    if (req.query.search === undefined) {
        req.query.search = "";
    }

    poolDefaultPSP.query(`SELECT * FROM agentes WHERE CONCAT(nome, callsign, nif, discord) LIKE "%${req.query.search}%"`, (err, rows, fields) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.status(200).send(rows);
    });
});

module.exports = app;