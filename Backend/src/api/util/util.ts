import express from 'express';
import {queryDB} from "../../utils/db-connector";
import {
    IntentData,
    PatentData,
    SpecialUnitData, SpecialUnitRoleData,
    StatusData, UtilIntentsResponse,
    UtilPatentsResponse, UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/api/util/schema";

const app = express.Router();


app.get("/patents", async (req, res) => {
    // Get what force the user is trying to get the patents from
    let force = req.headers["x-portalseguranca-force"];

    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

    // Get the list from the database
    const patents = await queryDB(force, `SELECT * FROM patents`);

    // Build an array with the patents
    let patentsList: PatentData[] = [];
    for (const patent of patents) {
        patentsList.push({
            id: patent.id,
            name: patent.name,
            max_evaluation: patent.max_evaluation
        });
    }

    // Build the response
    let response: UtilPatentsResponse = {
        message: "Operação bem sucedida",
        data: patentsList
    };

    // Return 200
    res.status(200).json(response);
});

app.get("/statuses", async (req, res) => {
    let force = req.headers["x-portalseguranca-force"];

    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

    // Get the list from the database
    const statuses = await queryDB(force, `SELECT * FROM status`);

    // Build an array with the statuses
    let statusesList: StatusData[] = [];
    for (const status of statuses) {
        statusesList.push({
            id: status.id,
            name: status.name
        });
    }

    // Build the response
    let response: UtilStatusesResponse = {
        message: "Operação bem sucedida",
        data: statusesList
    };

    // Send the list to the user
    res.status(200).json(response);
});

app.get("/specialunits", async (req, res) => {
    let force = req.headers["x-portalseguranca-force"];

    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

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
    let force = req.header("x-portalseguranca-force");
    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

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