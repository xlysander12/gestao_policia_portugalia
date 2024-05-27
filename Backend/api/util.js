const express = require('express');
const app = express.Router();
const {queryDB} = require("../db-connector");


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

    // Send the list to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: patents
    });
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
    const statutes = await queryDB(force, `SELECT * FROM status`);

    // Send the list to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: statutes
    });
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

    let response = {};

    // Get all the special units from the database
    response.units = await queryDB(force, `SELECT * FROM special_units`);

    // Get all the roles for the units
    response.roles = await queryDB(force, `SELECT * FROM specialunits_roles`);

    res.status(200).json({
        message: "Operação bem sucedida",
        data: response
    });
});

module.exports = app;

console.log("[Portal Segurança] Util routes loaded successfully.")