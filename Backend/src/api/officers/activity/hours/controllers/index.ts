import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {OfficerHoursResponse} from "@portalseguranca/api-types/officers/activity/output";
import {FORCE_HEADER} from "../../../../../utils/constants";
import buildFiltersQuery from "../../../../../utils/filters";
import {officerHoursHistory} from "../services";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import { RequestError } from "@portalseguranca/api-types";
import {OfficerHoursHistoryType} from "../repository";
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
        data: result.data!.map((hour: OfficerHoursHistoryType) => {
            return {
                ...hour,
                week_start: dateToString(hour.week_start, false),
                week_end: dateToString(hour.week_end, false)
            }
        })
    }))

}