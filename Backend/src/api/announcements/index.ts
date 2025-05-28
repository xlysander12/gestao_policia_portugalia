import express from "express";
import {getAnnouncementsController} from "./controllers";
import {logToConsole} from "../../utils/logger";

const app = express.Router();

// Route to get all announcements
app.get("/", getAnnouncementsController);

logToConsole("Events routes loaded successfully!", "info");
export default app;