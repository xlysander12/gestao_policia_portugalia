import express from "express";
import {queryDB} from "../../../../utils/db-connector";
import {FORCE_HEADER} from "../../../../utils/constants";
import {OfficerInfoAPIResponse} from "../../../../types";
import { UpdateOfficerLastShiftBodyType } from "@portalseguranca/api-types/officers/activity/input";
import { RequestSuccess } from "@portalseguranca/api-types";
import {getLastShiftController} from "./controllers";

const app = express.Router();

export async function updateOfficerLastShift(nif: number, last_shift: Date, force: string) {
    return await queryDB(force, `INSERT INTO officer_last_shift (officer, last_shift) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_shift = ?`, [nif, last_shift, last_shift]);
}

app.get("/", getLastShiftController);

app.put("/", async (req, res: OfficerInfoAPIResponse) => {
    let {last_shift} = req.body as UpdateOfficerLastShiftBodyType;

    // Update the last shift of the officer
    await updateOfficerLastShift(res.locals.targetOfficer.nif, new Date(Date.parse(last_shift)), <string>req.header(FORCE_HEADER));

    let response: RequestSuccess = {
        message: "Operação efetuada com sucesso.",
    }

    res.status(200).json(response);
});

export default app;