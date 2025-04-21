import express from "express";
import {logToConsole} from "../../utils/logger";
import {createEventController, getEventController, getEventsController} from "./controllers";
import {eventExistsMiddleware} from "../../middlewares/event-exists";

const app = express.Router();

// Route to get the list of all events
app.get("/", getEventsController);

// Route to create an Event
app.post("/", createEventController);

// * From this point on, the Event must exist
app.use("/:id", eventExistsMiddleware);

// Route to get the details of a specific event
app.get("/:id", getEventController);

logToConsole("Events routes loaded successfully!", "info");

export default app;