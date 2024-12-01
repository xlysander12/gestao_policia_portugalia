import express from "express";
import {OfficerInfoAPIResponse} from "../../../../types";
import {AddOfficerHoursBodyType} from "@portalseguranca/api-types/officers/activity/input";
import {queryDB} from "../../../../utils/db-connector";
import {FORCE_HEADER} from "../../../../utils/constants";
import {RequestError} from "@portalseguranca/api-types";

const app = express.Router();

app.post("/", async (req, res: OfficerInfoAPIResponse) => {
    const {week_start, week_end, minutes} = req.body as AddOfficerHoursBodyType;

    // Make sure there already aren't hours for this week
    const hours = await queryDB(req.header(FORCE_HEADER)!, `SELECT * FROM officer_hours WHERE week_end > ? AND officer = ?`, [week_start, res.locals.targetOfficer.nif]);
    if (hours.length > 0) {
        res.status(400).json({message: "Já existem horas para esta semana"} as RequestError);
        return;
    }

    // If there aren't, insert the new hours
    await queryDB(req.header(FORCE_HEADER)!, `INSERT INTO officer_hours (week_start, week_end, minutes, officer, submitted_by) VALUES (?, ?, ?, ?, ?)`, [week_start, week_end, minutes, res.locals.targetOfficer.nif, res.locals.user]);

    res.status(200).json({message: "Operação bem sucedida"});
});

app.delete("/:id", async (req, res: OfficerInfoAPIResponse) => {
    const {id} = req.params;

    // Make sure the hours entry exists
    const hours = await queryDB(req.header(FORCE_HEADER)!, `SELECT * FROM officer_hours WHERE id = ? AND officer = ?`, [id, res.locals.targetOfficer.nif]);
    if (hours.length === 0) {
        res.status(404).json({message: "Não encontrado"} as RequestError);
        return;
    }

    // If it does, delete it
    await queryDB(req.header(FORCE_HEADER)!, `DELETE FROM officer_hours WHERE id = ?`, [id]);

    res.status(200).json({message: "Operação bem sucedida"});
});

export default app;