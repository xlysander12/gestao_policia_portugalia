import express from "express";
import {
    createAnnouncementController,
    editAnnouncementController,
    getAnnouncementController,
    getAnnouncementsController
} from "./controllers";
import {logToConsole} from "../../utils/logger";
import {announcementEditableMiddle, announcementExistsMiddle} from "../../middlewares/announcement-exists";

const app = express.Router();

// Route to get all announcements
app.get("/", getAnnouncementsController);

// Route to create an announcement
app.post("/", createAnnouncementController);

// * From this point, an announcement should exist
app.use("/:id", announcementExistsMiddle);

// Route to get the details of an announcement
app.get("/:id", getAnnouncementController)

// Route to edit the details of an announcement
app.patch("/:id", announcementEditableMiddle, editAnnouncementController);

logToConsole("Announcements routes loaded successfully!", "info");
export default app;