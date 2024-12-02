import express from "express";
import {APIResponse, OfficerInfoAPIResponse} from "../../../types";
import {hireOfficer, listOfficers} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {dateToString} from "../../../utils/date-handler";

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
            name: res.locals.targetOfficer.name,
            patent: res.locals.targetOfficer.patent,
            callsign: res.locals.targetOfficer.callsign,
            status: res.locals.targetOfficer.status,
            nif: res.locals.targetOfficer.nif,
            phone: res.locals.targetOfficer.phone,
            iban: res.locals.targetOfficer.iban,
            kms: res.locals.targetOfficer.kms,
            discord: res.locals.targetOfficer.discord,
            steam: res.locals.targetOfficer.steam,
            entry_date: dateToString(res.locals.targetOfficer.entry_date, false),
            promotion_date: res.locals.targetOfficer.promotion_date !== null ? dateToString(res.locals.targetOfficer.promotion_date, false) : null,
            special_units: res.locals.targetOfficer.special_units
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