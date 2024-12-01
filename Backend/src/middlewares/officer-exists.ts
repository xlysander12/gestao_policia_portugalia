import {Request, NextFunction} from "express";
import {queryDB} from "../utils/db-connector";
import {FORCE_HEADER} from "../utils/constants";
import {APIResponse} from "../types";


async function officerExistsMiddle(req: Request, res: APIResponse, next: NextFunction) {
    let officerResult = await queryDB(req.header(FORCE_HEADER)!, `SELECT * FROM ${req.query.hasOwnProperty("pretty") ? "officersV" : "officers"} WHERE nif = ?`, req.params.nif);
    if (officerResult.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    res.locals.requestedOfficerData = officerResult[0];

    // Alter the dates to be a proper string (There's a lot of unknown shit going on here.
    // For more information on wtf is going on, check https://stackoverflow.com/a/29774197)
    res.locals.requestedOfficerData.entry_date = String(new Date(res.locals.requestedOfficerData.entry_date.getTime() - (res.locals.requestedOfficerData.entry_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]);
    res.locals.requestedOfficerData.promotion_date = res.locals.requestedOfficerData.promotion_date !== null ? String(new Date(res.locals.requestedOfficerData.promotion_date.getTime() - (res.locals.requestedOfficerData.promotion_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]): null;
    next();
}

export default officerExistsMiddle;