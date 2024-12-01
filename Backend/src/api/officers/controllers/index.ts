import express from "express";
import {APIResponse} from "../../../types";
import {listOfficers} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";

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