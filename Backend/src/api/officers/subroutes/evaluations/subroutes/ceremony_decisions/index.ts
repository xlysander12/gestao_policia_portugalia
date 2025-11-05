import {Router} from "express";
import {logToConsole} from "../../../../../../utils/logger";
import {createCeremonyDecisionController, getCeremonyDecisionsController} from "./controllers";

const app = Router();

// Route to list all decisions about an officer
app.get("/", getCeremonyDecisionsController);

// Route to create a decision about an officer
app.post("/", createCeremonyDecisionController);

logToConsole("Officers Ceremony Decisions routes loaded successfully", "info");
export default app;