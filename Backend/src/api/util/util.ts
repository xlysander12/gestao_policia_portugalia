import express from 'express';
import {queryDB} from "../../utils/db-connector";
import {
    IntentData,
    SpecialUnitData, SpecialUnitRoleData,
    UtilIntentsResponse,
    UtilSpecialUnitsResponse,
} from "@portalseguranca/api-types/util/schema";
import {FORCE_HEADER} from "../../utils/constants";
import {getPatentsController, getStatusesController} from "./controllers";

const app = express.Router();


app.get("/patents", getPatentsController);

app.get("/statuses", getStatusesController);

app.get("/specialunits", async (req, res) => {
    let force = req.header(FORCE_HEADER)!;

    // Get all the special units from the database and build an array with its data
    const specialUnitsQuery = await queryDB(force, `SELECT * FROM special_units`);

    let specialUnitsList: SpecialUnitData[] = [];
    for (const unit of specialUnitsQuery) {
        specialUnitsList.push({
            id: unit.id,
            name: unit.name,
            acronym: unit.acronym,
            description: unit.description
        });
    }

    // Get all the roles for the units from the database and build an array with its data
    const specialUnitsRolesQuery = await queryDB(force, `SELECT * FROM specialunits_roles`);

    let specialUnitsRolesList: SpecialUnitRoleData[] = [];
    for (const role of specialUnitsRolesQuery) {
        specialUnitsRolesList.push({
            id: role.id,
            name: role.name
        });
    }

    // Build the response
    const response: UtilSpecialUnitsResponse = {
        message: "Operação bem sucedida",
        data: {
            units: specialUnitsList,
            roles: specialUnitsRolesList
        }
    }

    // Return 200
    res.status(200).json(response);
});

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