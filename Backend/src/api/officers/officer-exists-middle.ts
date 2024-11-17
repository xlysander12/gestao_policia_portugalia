import {Request, Response, NextFunction} from "express";
import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER} from "../../utils/constants";


export async function officerExistsMiddle(req: Request, res: Response, next: NextFunction) {
    let officerResult = await queryDB(req.header(FORCE_HEADER), `SELECT * FROM ${req.query.hasOwnProperty("pretty") ? "officersV" : "officers"} WHERE nif = ?`, req.params.nif);
    if (officerResult.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    res.locals.requestedOfficerData = officerResult[0];
    next();
}