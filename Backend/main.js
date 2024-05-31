// Importing dotenv and initializing it
const dotenv = require("dotenv");
dotenv.config({path: __dirname + "\\.env"});

// Importing necessary modules
const express = require("express");
const app = express.Router(); // This app is a router to compartimentalize routes
const path = require("path");

// TODO: Make sure every environment variable is set

// React Static
app.use(express.static(path.join(__dirname, "..", "Frontend", "build")));

// Import the API routes
app.use("/api", require("./api/main"));

// React Build
app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});


module.exports = app;

console.log("[Portal Segurança] Portal Segurança has been fully loaded!")