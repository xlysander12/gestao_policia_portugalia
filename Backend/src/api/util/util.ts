import express from 'express';
import {queryDB} from "../../utils/db-connector";
import {
    IntentData, UtilIntentsResponse,
} from "@portalseguranca/api-types/util/schema";
import {FORCE_HEADER} from "../../utils/constants";
import {getPatentsController, getSpecialUnitsController, getStatusesController} from "./controllers";

const app = express.Router();


app.get("/patents", getPatentsController);

app.get("/statuses", getStatusesController);

app.get("/special-units", getSpecialUnitsController);

app.get("/intents", async (req, res) => {
    let force = req.header(FORCE_HEADER)!;

    // Get the list from the database
    const intents = await queryDB(force, `SELECT * FROM intents`);

    // Build an array with the statuses
    let intentsList: IntentData[] = [];
    for (const intent of intents) {
        intentsList.push({
            name: intent.name,
            description: intent.description
        });
    }

    // Build the response
    let response: UtilIntentsResponse = {
        message: "Operação bem sucedida",
        data: intentsList
    };

    // Send the list to the user
    res.status(200).json(response);
});

console.log("[Portal Segurança] Util routes loaded successfully.");

export default app;