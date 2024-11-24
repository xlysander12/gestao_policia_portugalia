import express from "express";
import {queryDB} from "../../../utils/db-connector";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerLastShiftResponse} from "@portalseguranca/api-types/officers/activity/output";
import {UpdateOfficerLastShiftBodyType} from "@portalseguranca/api-types/officers/activity/input";
import { RequestSuccess } from "@portalseguranca/api-types";
import {OfficerInfoAPIResponse} from "../../../types";

const app = express.Router();

export async function updateOfficerLastShift(nif: number, last_shift: Date, force: string) {
    return await queryDB(force, `INSERT INTO officer_last_shift (officer, last_shift) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_shift = ?`, [nif, last_shift, last_shift]);
}

app.get("/", async (req, res: OfficerInfoAPIResponse) => {
    // Query the DB for the last shift of the officer
    let result = await queryDB(req.header(FORCE_HEADER), `SELECT last_shift FROM officer_last_shift WHERE officer = ?`, res.locals.requestedOfficerData.nif);

    if (result.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum turno anterior para o efetivo."
        });
        return;
    }

    let response: OfficerLastShiftResponse = {
        message: "Operação efetuada com sucesso.",
        data: {
            last_shift: result[0].last_shift.toISOString().split("T")[0]
        }
    }

    res.status(200).json(response);
});

app.put("/", async (req, res: OfficerInfoAPIResponse) => {
    let {last_shift} = req.body as UpdateOfficerLastShiftBodyType;

    // Update the last shift of the officer
    await updateOfficerLastShift(res.locals.requestedOfficerData.nif, new Date(Date.parse(last_shift)), <string>req.header(FORCE_HEADER));

    let response: RequestSuccess = {
        message: "Operação efetuada com sucesso.",
    }

    res.status(200).json(response);
});

export default app;