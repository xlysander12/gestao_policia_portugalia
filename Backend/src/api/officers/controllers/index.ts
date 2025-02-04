import express from "express";
import {APIResponse, OfficerInfoAPIResponse} from "../../../types";
import {alterOfficer, deleteOfficer, hireOfficer, listOfficers, officerPatrol, restoreOfficer} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerInfoGetResponse, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import {dateToString} from "../../../utils/date-handler";
import {DeleteOfficerRequestBody, UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {isQueryParamPresent} from "../../../utils/filters";
import {userHasIntents} from "../../accounts/repository";
import {PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";

export async function getOfficersListController(req: express.Request, res: APIResponse<OfficerListResponse>) {
    // Call the service
    let result = await listOfficers(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams);

    // Check if the result is valid
    if (!result.result) {
        return res.status(result.status).json({
            message: result.message!
        });
    }

    // Return the result
    return res.status(result.status).json({
        message: result.message,
        data: result.data!
    });

}

export async function getOfficerDetailsController(req: express.Request, res: OfficerInfoAPIResponse<OfficerInfoGetResponse>) {
    const {isFormer, force, ...officerData} = res.locals.targetOfficer!;

    res.status(200).json({
        message: "Operação bem sucedida",
        meta: {
            former: res.locals.targetOfficer!.isFormer,
            force: res.locals.targetOfficer!.force
        },
        data: (res.locals.targetOfficer?.isFormer && !(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "officers"))) || (res.locals.targetOfficer!.force !== req.header(FORCE_HEADER)!) ?
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
    });
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
    return res.status(result.status).json({message: result.message});
}

export async function restoreOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Call the service
    let result = await restoreOfficer(res.locals.targetOfficer!, req.header(FORCE_HEADER)!);

    // Return the result
    return res.status(result.status).json({message: result.message});
}

export async function alterOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * Get the changes
    let changes = req.body as UpdateOfficerRequestBody;

    // Call the service
    let result = await alterOfficer(res.locals.targetOfficer!.nif, req.header(FORCE_HEADER)!, res.locals.targetOfficer!, changes, res.locals.loggedOfficer);

    // Return the result
    return res.status(result.status).json({message: result.message});
}

export async function deleteOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {reason} = req.body as DeleteOfficerRequestBody;

    // Call the service
    let result = await deleteOfficer(req.header(FORCE_HEADER)!, res.locals.targetOfficer!, res.locals.loggedOfficer, reason);

    // Return the result
    return res.status(result.status).json({message: result.message});

}

export async function getOfficerCurrentPatrolController(req: express.Request, res: OfficerInfoAPIResponse<PatrolInfoResponse>) {
    // Call the service
    let result = await officerPatrol(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif);

    // Return the result
    if (!result.result) {
        return res.status(result.status).json({message: result.message});
    }

    return res.status(result.status).json({
        message: result.message,
        data: {
            ...result.data!,
            id: `${result.data!.force}${result.data!.id}`,
            start: dateToString(result.data!.start),
            end: result.data!.end !== null ? dateToString(result.data!.end): null
        }
    });
}