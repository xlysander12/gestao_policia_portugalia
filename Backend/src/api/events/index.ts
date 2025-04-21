import express from "express";
import {logToConsole} from "../../utils/logger";
import {
    createEventController,
    deleteEventController,
    editEventController,
    getEventController,
    getEventsController
} from "./controllers";
import {eventExistsMiddleware, isEventEditableMiddleware} from "../../middlewares/event-exists";

const app = express.Router();

// Route to get the list of all events
app.get("/", getEventsController);

// Route to create an Event
app.post("/", createEventController);

// * From this point on, the Event must exist
app.use("/:id", eventExistsMiddleware);

// Route to get the details of an Event
app.get("/:id", getEventController);

// Route to edit an Event
app.patch("/:id", isEventEditableMiddleware, editEventController);

// Route to delete an Event
app.delete("/:id", isEventEditableMiddleware, deleteEventController);

logToConsole("Events routes loaded successfully!", "info");

export default app;