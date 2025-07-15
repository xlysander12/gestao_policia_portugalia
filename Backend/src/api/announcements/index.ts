import express from "express";
import {createAnnouncementController, getAnnouncementController, getAnnouncementsController} from "./controllers";
import {logToConsole} from "../../utils/logger";
import announcementExistsMiddle from "../../middlewares/announcement-exists";

const app = express.Router();

// Route to get all announcements
app.get("/", getAnnouncementsController);

// Route to create an announcement
app.post("/", createAnnouncementController);

// * From this point, an announcement should exist
app.use("/:id", announcementExistsMiddle);

// Route to get the details of an announcement
app.get("/:id", getAnnouncementController)

logToConsole("Announcements routes loaded successfully!", "info");
export default app;