import {Router} from "express";
import {logToConsole} from "../../../../../../utils/logger";
import {getCeremonyDecisionsController} from "./controllers";

const app = Router();

// Route to list all decisions about an officer
app.get("/", getCeremonyDecisionsController);

logToConsole("Officers Ceremony Decisions routes loaded successfully", "info");
export default app;