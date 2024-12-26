import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {OfficerHoursResponse, OfficerSpecificHoursResponse} from "@portalseguranca/api-types/officers/activity/output";
import {FORCE_HEADER} from "../../../../../utils/constants";
import buildFiltersQuery from "../../../../../utils/filters";
import {addOfficerHoursEntry, deleteOfficerHoursEntry, officerHoursEntry, officerHoursHistory} from "../services";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import { RequestError } from "@portalseguranca/api-types";
import {OfficerHoursEntryType} from "../repository";
import {dateToString, stringToDate} from "../../../../../utils/date-handler";
import { AddOfficerHoursBodyType } from "@portalseguranca/api-types/officers/activity/input";
import {queryDB} from "../../../../../utils/db-connector";

export async function getOfficerHoursHistoryController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Get the filters values
    let filters = [];
    for (const query in req.query) {
        filters.push({name: query, value: req.query[query]});
    }

    // Build the filters from the route
    const filtersResult = buildFiltersQuery(res.locals.routeDetails!, filters, {subquery: "officer = ?", value: res.locals.targetOfficer.nif});

    // Call the service to get the hours
    let result = await officerHoursHistory(req.header(FORCE_HEADER)!, filtersResult);

    if (!result.result) {
        res.status(result.status).json(ensureAPIResponseType<RequestError>({message: result.message!}));
        return;
    }

    res.status(result.status).json(ensureAPIResponseType<OfficerHoursResponse>({
        message: result.message!,
        data: result.data!.map((hour: OfficerHoursEntryType) => {
            return {
                ...hour,
                week_start: dateToString(hour.week_start, false),
                week_end: dateToString(hour.week_end, false)
            }
        })
    }))

}

export async function getOfficerHoursEntryController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {id} = req.params;

    // Call the service to get the hours
    let result = await officerHoursEntry(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, parseInt(id));

    // Return the result of the service
    if (!result.result) {
        res.status(result.status).json(ensureAPIResponseType<RequestError>({message: result.message!}));
        return;
    }

    res.status(result.status).json(ensureAPIResponseType<OfficerSpecificHoursResponse>({
        message: result.message!,
        data: {
            ...result.data!,
            week_start: dateToString(result.data!.week_start, false),
            week_end: dateToString(result.data!.week_end, false)
        }
    }));
}

export async function addOfficerHoursEntryController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {week_start, week_end, minutes} = req.body as AddOfficerHoursBodyType;

    // Call the service to add the hours
    let result = await addOfficerHoursEntry(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, stringToDate(week_start), stringToDate(week_end), minutes, res.locals.loggedOfficer);

    res.status(result.status).json({message: result.message});
}

export async function deleteOfficerGetHoursEntryController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {id} = req.params;

    // Call the service to delete the hours
    const result = await deleteOfficerHoursEntry(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, parseInt(id));

    res.status(result.status).json({message: result.message});
}