import express from "express";
import {getOfficerJustificationDetails} from "../repository";
import {FORCE_HEADER} from "../../../../../utils/constants";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import { RequestError } from "@portalseguranca/api-types";
import {OfficerJustificationAPIResponse} from "../../../../../types/response-types";
import {stringToDate} from "../../../../../utils/date-handler";

export async function justificationExistsMiddleware(req: express.Request, res: OfficerJustificationAPIResponse, next: express.NextFunction) {
    // * Make sure the provided justification id is valid
    let justification = await getOfficerJustificationDetails(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, parseInt(req.params["id"]));

    // If the justification doesn't exist, return an error
    if (justification === null) {
        res.status(404).json(ensureAPIResponseType<RequestError>({
            message: "Justificação não encontrada"
        }));
        return;
    }

    // Store the justification in the response locals
    res.locals.justification = {
        id: justification.id,
        officer: res.locals.targetOfficer.nif,
        type: justification.type,
        start: stringToDate(justification.start),
        end: justification.end ? stringToDate(justification.end): null,
        description: justification.description,
        status: justification.status,
        managed_by: justification.managed_by
    };

    next();
}