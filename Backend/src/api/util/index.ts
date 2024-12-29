import express from 'express';
import {
    getInactivityTypesController,
    getIntentsController,
    getPatentsController,
    getSpecialUnitsController,
    getStatusesController
} from "./controllers";

const app = express.Router();


app.get("/patents", getPatentsController);

app.get("/statuses", getStatusesController);

app.get("/special-units", getSpecialUnitsController);

app.get("/intents", getIntentsController);

app.get("/inactivity-types", getInactivityTypesController);

console.log("[Portal Segurança] Util routes loaded successfully.");

export default app;