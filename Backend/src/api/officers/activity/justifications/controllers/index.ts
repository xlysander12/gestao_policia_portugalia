import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {
    officerHistory, officerJustificationChangeDetails,
    officerJustificationCreate, officerJustificationDelete,
    officerJustificationUpdateStatus
} from "../services";
import {FORCE_HEADER} from "../../../../../utils/constants";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
import {
    OfficerJustificationDetailsResponse,
    OfficerJustificationsHistoryResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {userHasIntents} from "../../../../accounts/repository";
import {
    AddOfficerJusitificationBodyType, ChangeOfficerJustificationBodyType,
    ManageOfficerJustificationBodyType
} from "@portalseguranca/api-types/officers/activity/input";
import {OfficerJustificationAPIResponse} from "../../../../../types/response-types";
import {dateToString} from "../../../../../utils/date-handler";

export async function getOfficerJustificationsHistoryController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * Make sure the requesting account has permission to check this info
    // If the requesting account isn't the target officer, check if the requesting account has the "activity" intent
    if (res.locals.targetOfficer.nif !== res.locals.loggedOfficer.nif && !(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "activity"))) {
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

export async function getOfficerJustificationDetailsController(req: express.Request, res: OfficerJustificationAPIResponse) {
    // * Make sure the requesting account has permission to check this info
    // If the requesting account isn't the target officer, check if the requesting account has the "activity" intent
    if (res.locals.targetOfficer.nif !== res.locals.loggedOfficer.nif && !(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "activity"))) {
        res.status(403).json(ensureAPIResponseType<RequestError>({
            message: "Não tem permissão para aceder a esta informação"
        }));
        return
    }

    // Return the justification data from the locals
    res.status(200).json(ensureAPIResponseType<OfficerJustificationDetailsResponse>({
        message: "Operação concluída com sucesso",
        data: {
            id: res.locals.justification.id,
            type: res.locals.justification.type,
            start: dateToString(res.locals.justification.start),
            end: res.locals.justification.end ? dateToString(res.locals.justification.end): null,
            description: res.locals.justification.description,
            status: res.locals.justification.status,
            managed_by: res.locals.justification.managed_by
        }
    }));
}

export async function createOfficerJustificationController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * If the logged officer is not the target officer, then the logged officer must have the "activity" intent
    if (res.locals.loggedOfficer.nif !== res.locals.targetOfficer.nif) {
        if (!(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "activity"))) {
            res.status(403).json(ensureAPIResponseType<RequestError>({
                message: "Não tens permissão para realizar esta ação"
            }));
            return;
        }
    }

    // * Since the permissions are okay, call the service to create the justification
    // Get the data from the request
    let {type, start, end, description} = req.body as AddOfficerJusitificationBodyType;

    // Get the result from the service
    let result = await officerJustificationCreate(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, type, description, start, end);

    // Return the result
    res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({
        message: result.message
    }));
}

export async function manageOfficerJustificationController(req: express.Request, res: OfficerJustificationAPIResponse) {
    // Get the value from the request
    let {approved} = req.body as ManageOfficerJustificationBodyType;

    // Call the service to manage the justification
    let result = await officerJustificationUpdateStatus(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, res.locals.justification, approved, res.locals.loggedOfficer.nif);

    // Return the result
    res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({
        message: result.message
    }));
}

export async function changeOfficerJustificationController(req: express.Request, res: OfficerJustificationAPIResponse) {
    // Call the service to change the data of the justification
    let result = await officerJustificationChangeDetails(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, res.locals.justification, req.body as ChangeOfficerJustificationBodyType);

    // Return the result
    res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({
        message: result.message
    }));
}

export async function deleteOfficerJustificationController(req: express.Request, res: OfficerJustificationAPIResponse) {
    // Call the service to change the data of the justification
    let result = await officerJustificationDelete(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, res.locals.justification);

    // Return the result
    res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({
        message: result.message
    }));
}