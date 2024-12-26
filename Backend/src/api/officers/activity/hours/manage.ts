import express from "express";
import {OfficerInfoAPIResponse} from "../../../../types";
import {queryDB} from "../../../../utils/db-connector";
import {FORCE_HEADER} from "../../../../utils/constants";
import {RequestError} from "@portalseguranca/api-types";

const app = express.Router();



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