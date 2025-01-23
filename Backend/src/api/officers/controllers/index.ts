import express from "express";
import {APIResponse, OfficerInfoAPIResponse} from "../../../types";
import {alterOfficer, deleteOfficer, hireOfficer, listOfficers} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerInfoGetResponse, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import {dateToString} from "../../../utils/date-handler";
import {DeleteOfficerRequestBody, UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {ensureAPIResponseType} from "../../../utils/request-handler";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";

export async function getOfficersListController(req: express.Request, res: APIResponse) {
    // Call the service
    let result = await listOfficers(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams);

    // Check if the result is valid
    if (!result.result) {
        return res.status(result.status).json(ensureAPIResponseType<RequestError>({
            message: result.message!
        }));
    }

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<OfficerListResponse>({
        message: result.message,
        data: result.data!
    }));

}

export async function getOfficerDetailsController(req: express.Request, res: OfficerInfoAPIResponse) {
    res.json(ensureAPIResponseType<OfficerInfoGetResponse>({
        message: "Operação bem sucedida",
        meta: {
            former: !!res.locals.targetOfficerFormer
        },
        data: {
            ...res.locals.targetOfficer,
            entry_date: dateToString(res.locals.targetOfficer.entry_date, false),
            promotion_date: res.locals.targetOfficer.promotion_date !== null ? dateToString(res.locals.targetOfficer.promotion_date, false) : null
        }
    }));
}

export async function addOfficerController(req: express.Request, res: APIResponse) {
    // TODO: This route must check if the provided nif is a former Officer, and if so, ask if the user wants to import their old data.
    //  To do this, if no query param is given, the server just responds with a 100 status code and a message asking if the user wants to import the old data.
    //  If the query param "restore" is given as a boolean, the server will import the old data or replace it with the new data.
    // Call the service
    let result = await hireOfficer(req.body.name, req.body.phone, req.body.iban, req.body.nif, req.body.kms, req.body.discord, req.body.steam, req.body.recruit, req.header(FORCE_HEADER)!);

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));
}

export async function alterOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * Get the changes
    let changes = req.body as UpdateOfficerRequestBody;

    // Call the service
    let result = await alterOfficer(res.locals.targetOfficer.nif, req.header(FORCE_HEADER)!, res.locals.targetOfficer, changes, res.locals.loggedOfficer);

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));
}

export async function deleteOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {reason} = req.body as DeleteOfficerRequestBody;

    // Call the service
    let result = await deleteOfficer(req.header(FORCE_HEADER)!, res.locals.targetOfficer, res.locals.loggedOfficer, reason);

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));

}