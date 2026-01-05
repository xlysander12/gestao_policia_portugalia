import {Router} from "express";
import {logToConsole} from "../../../../../../utils/logger";
import {
    createCeremonyDecisionController, editCeremonyDecisionController,
    getCeremonyDecisionByIdController,
    getCeremonyDecisionsController
} from "./controllers";
import {ceremonyDecisionExistsMiddleware} from "../../../../../../middlewares/ceremony-decision-exists";

const app = Router();

// Route to list all decisions about an officer
app.get("/", getCeremonyDecisionsController);

// Route to create a decision about an officer
app.post("/", createCeremonyDecisionController);

// * From this point, the decision must already exist
app.use("/:id", ceremonyDecisionExistsMiddleware);

// Route to get the details of a specific decision
app.get("/:id", getCeremonyDecisionByIdController);

// Route to edit the details of a specific decision
app.patch("/:id", editCeremonyDecisionController);

logToConsole("Officers Ceremony Decisions routes loaded successfully", "info");
export default app;