import express from "express";
import {APIResponse, OfficerInfoAPIResponse} from "../../../types";
import {alterOfficer, hireOfficer, listOfficers} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {dateToString} from "../../../utils/date-handler";
import {DeleteOfficerRequestBody, UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";

export async function getOfficersListController(req: express.Request, res: APIResponse) {
    // * Get the filters
    // Build an array with all present filters in the query params of the request
    let filters: {name: string, value: any}[] = [];
    for (const key in req.query) {
        filters.push({name: key, value: req.query[key]});
    }

    // Call the service
    let result = await listOfficers(req.header(FORCE_HEADER)!, res.locals.routeDetails, filters);

    // Check if the result is valid
    if (!result.result) {
        return res.status(result.status).json({message: result.message});
    }

    // Return the result
    return res.status(result.status).json(result.data);

}

export async function getOfficerDetailsController(req: express.Request, res: OfficerInfoAPIResponse) {
    res.json(<OfficerInfoGetResponse>{
        message: "Operação bem sucedida",
        data: {
            ...res.locals.targetOfficer,
            entry_date: dateToString(res.locals.targetOfficer.entry_date, false),
            promotion_date: res.locals.targetOfficer.promotion_date !== null ? dateToString(res.locals.targetOfficer.promotion_date, false) : null
        }
    });
}

export async function addOfficerController(req: express.Request, res: APIResponse) {
    // Call the service
    let result = await hireOfficer(req.body.name, req.body.phone, req.body.iban, req.body.nif, req.body.kms, req.body.discord, req.body.steam, req.body.recruit, req.header(FORCE_HEADER)!);

    // Check if the result is valid
    if (!result.result) {
        return res.status(result.status).json({message: result.message});
    }

    // Return the result
    return res.status(result.status).json({message: "Operação bem sucedida"});
}

export async function alterOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    // * Get the changes
    let changes = req.body as UpdateOfficerRequestBody;

    // Call the service
    let result = await alterOfficer(res.locals.targetOfficer.nif, req.header(FORCE_HEADER)!, res.locals.targetOfficer, changes, res.locals.loggedOfficer);

    // Check if the result is valid
    if (!result.result) {
        return res.status(result.status).json({message: result.message});
    }

    // Return the result
    return res.status(result.status).json({message: "Operação bem sucedida"});
}

export async function deleteOfficerController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {reason} = req.body as DeleteOfficerRequestBody;



}