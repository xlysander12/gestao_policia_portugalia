import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {officerHistory} from "../services";
import {FORCE_HEADER} from "../../../../../utils/constants";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import { RequestError } from "@portalseguranca/api-types";
import {OfficerJustificationsHistoryResponse} from "@portalseguranca/api-types/officers/activity/output";
import {userHasIntents} from "../../../../accounts/repository";

export async function getOfficerJustificationsHistoryController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * Make sure the requesting account has permission to check this info
    // If the requesting account isn't the target officer, check if the requesting account has the "activity" intent
    if (res.locals.targetOfficer.nif !== res.locals.loggedOfficer.nif && !(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER), "activity"))) {
        res.status(403).json(ensureAPIResponseType<RequestError>({
            message: "Não tem permissão para aceder a esta informação"
        }));
        return
    }

    // Call the service to get the data
    let result = await officerHistory(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif);

    // Return the result, depending on success
    if (!result.result) {
        res.status(result.status).json(ensureAPIResponseType<RequestError>({
            message: result.message,
        }));
    }

    res.status(result.status).json(ensureAPIResponseType<OfficerJustificationsHistoryResponse>({
        message: result.message,
        data: result.data!
    }));
}