// Importing basic libraries
import express, {Router} from "express";
import bodyParser from "body-parser"
import cookieParser from "cookie-parser";
import serveIndex from "serve-index";
// Load .env file
import {config} from "dotenv";
import {join} from "path";
config({path: join(__dirname, "..", ".env")});

import {apiRoutes} from "./api";


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
app.use("/db", express.static(join(__dirname, "..", "..", "Database")), serveIndex(join(__dirname, "..", "..", "Database"), {icons: true, view: "details"}));

// React Build
app.get("/*", (req, res) => {
    res.sendFile(join(__dirname, "..", "..", "Frontend", "dist", "index.html"));
});


export default app;

console.log("[Portal Segurança] Portal Segurança has been fully loaded!")