import express from "express";
import {APIResponse, OfficerInfoAPIResponse} from "../../../types";
import {alterOfficer, deleteOfficer, hireOfficer, listOfficers, restoreOfficer} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerInfoGetResponse, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import {dateToString} from "../../../utils/date-handler";
import {DeleteOfficerRequestBody, UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {ensureAPIResponseType} from "../../../utils/request-handler";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
import {isQueryParamPresent} from "../../../utils/filters";
import {userHasIntents} from "../../accounts/repository";

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
    const {isFormer, ...officerData} = res.locals.targetOfficer!;

    res.json(ensureAPIResponseType<OfficerInfoGetResponse>({
        message: "Operação bem sucedida",
        meta: {
            former: res.locals.targetOfficer!.isFormer,
            sameForce: !!res.locals.targetOfficer!.isSameForce
        },
        data: (res.locals.targetOfficer?.isFormer && !(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "officers"))) || !res.locals.targetOfficer!.isSameForce ?
            {
                name: res.locals.targetOfficer!.name,
                patent: res.locals.targetOfficer!.patent,
                callsign: res.locals.targetOfficer!.callsign,
                status: res.locals.targetOfficer!.status,
                nif: res.locals.targetOfficer!.nif,
            } : {
                ...officerData!,
                entry_date: dateToString(res.locals.targetOfficer!.entry_date, false),
                promotion_date: res.locals.targetOfficer!.promotion_date !== null ? dateToString(res.locals.targetOfficer!.promotion_date, false) : null
            }
    }));
}

export async function addOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    let result = await hireOfficer(
        req.body.name,
        req.body.phone,
        req.body.iban,
        parseInt(req.params.nif),
        req.body.kms,
        req.body.discord,
        req.body.steam,
        req.body.recruit,
        req.header(FORCE_HEADER)!,
        res.locals.targetOfficer,
        !!res.locals.targetOfficer?.isFormer,
        isQueryParamPresent("overwrite", res.locals.queryParams)
    );

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));
}

export async function restoreOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Call the service
    let result = await restoreOfficer(res.locals.targetOfficer!, req.header(FORCE_HEADER)!);

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));
}

export async function alterOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * Get the changes
    let changes = req.body as UpdateOfficerRequestBody;

    // Call the service
    let result = await alterOfficer(res.locals.targetOfficer!.nif, req.header(FORCE_HEADER)!, res.locals.targetOfficer!, changes, res.locals.loggedOfficer);

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));
}

export async function deleteOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {reason} = req.body as DeleteOfficerRequestBody;

    // Call the service
    let result = await deleteOfficer(req.header(FORCE_HEADER)!, res.locals.targetOfficer!, res.locals.loggedOfficer, reason);

    // Return the result
    return res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message}));

}