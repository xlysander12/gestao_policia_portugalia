import {Router} from "express";
import {logToConsole} from "../../../../../../utils/logger";
import {
    createCeremonyDecisionController, deleteCeremonyDecisionController, editCeremonyDecisionController,
    getCeremonyDecisionByIdController,
    getCeremonyDecisionsController
} from "./controllers";
import {ceremonyDecisionCanBeViewedMiddleware, ceremonyDecisionExistsMiddleware} from "../../../../../../middlewares/ceremony-decisions";

const app = Router();

// A User can only see decision of officers they can evaluate
app.use("/", ceremonyDecisionCanBeViewedMiddleware);

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

// Route to delete a decision
app.delete("/:id", deleteCeremonyDecisionController);

logToConsole("Officers Ceremony Decisions routes loaded successfully", "info");
export default app;