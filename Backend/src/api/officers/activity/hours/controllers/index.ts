import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {OfficerHoursResponse, OfficerSpecificHoursResponse} from "@portalseguranca/api-types/officers/activity/output";
import {FORCE_HEADER} from "../../../../../utils/constants";
import buildFiltersQuery from "../../../../../utils/filters";
import {officerHoursEntry, officerHoursHistory} from "../services";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import { RequestError } from "@portalseguranca/api-types";
import {OfficerHoursEntryType} from "../repository";
import {dateToString} from "../../../../../utils/date-handler";

export async function getOfficerHoursHistoryController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Get the filters values
    let filters = [];
    for (const query in req.query) {
        filters.push({name: query, value: req.query[query]});
    }

    // Build the filters from the route
    const filtersResult = buildFiltersQuery(res.locals.routeDetails!, filters, {subquery: "officer = ?", value: res.locals.targetOfficer.nif});

    // Call the service to get the hours
    let result = await officerHoursHistory(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, filtersResult);

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