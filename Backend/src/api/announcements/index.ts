import express from "express";
import {getAnnouncementController, getAnnouncementsController} from "./controllers";
import {logToConsole} from "../../utils/logger";
import announcementExistsMiddle from "../../middlewares/announcement-exists";

const app = express.Router();

// Route to get all announcements
app.get("/", getAnnouncementsController);

// * From this point, an announcement should exist
app.use("/:id", announcementExistsMiddle);

// Route to get the details of an announcement
app.get("/:id", getAnnouncementController)

logToConsole("Announcements routes loaded successfully!", "info");
export default app;