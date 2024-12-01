import {Request, NextFunction} from "express";
import {FORCE_HEADER} from "../utils/constants";
import {OfficerInfoAPIResponse} from "../types";
import {getOfficerData} from "../api/officers/repository";


async function officerExistsMiddle(req: Request, res: OfficerInfoAPIResponse, next: NextFunction) {
    let officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!);
    if (officerResult === null) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    res.locals.targetOfficer = officerResult;

    next();
}

export default officerExistsMiddle;