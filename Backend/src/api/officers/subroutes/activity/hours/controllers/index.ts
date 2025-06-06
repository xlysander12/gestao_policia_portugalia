import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../../types";
import {OfficerHoursResponse, OfficerSpecificHoursResponse} from "@portalseguranca/api-types/officers/activity/output";
import {FORCE_HEADER} from "../../../../../../utils/constants";
import {
    addOfficerHoursEntry,
    deleteOfficerHoursEntry,
    lastOfficerHours,
    officerHoursEntry,
    officerHoursHistory
} from "../services";
import {OfficerHoursEntryType} from "../repository";
import {dateToUnix, unixToDate} from "../../../../../../utils/date-handler";
import { AddOfficerHoursBodyType } from "@portalseguranca/api-types/officers/activity/input";
import {getForceMinWeekMinutes} from "../../../../../../utils/config-handler";

export async function getOfficerHoursHistoryController(req: express.Request, res: OfficerInfoAPIResponse<OfficerHoursResponse>) {
    // Call the service to get the hours
    const result = await officerHoursHistory(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, res.locals.routeDetails.filters!, res.locals.queryParams);

    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data!.map((hour: OfficerHoursEntryType) => {
            return {
                ...hour,
                week_start: dateToUnix(hour.week_start),
                week_end: dateToUnix(hour.week_end)
            }
        })
    });

}

export async function getOfficerHoursEntryController(req: express.Request, res: OfficerInfoAPIResponse<OfficerSpecificHoursResponse>) {
    const {id} = req.params;

    // Call the service to get the hours
    const result = await officerHoursEntry(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, parseInt(id));

    // Return the result of the service
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        meta: {
            min_hours: result.data!.minutes >= getForceMinWeekMinutes(req.header(FORCE_HEADER)!)
        },
        data: {
            ...result.data!,
            week_start: dateToUnix(result.data!.week_start),
            week_end: dateToUnix(result.data!.week_end)
        }
    });
}

export async function getOfficerLastWeekController(req: express.Request, res: OfficerInfoAPIResponse<OfficerSpecificHoursResponse>) {
    // Call the service to get the last week hours
    const result = await lastOfficerHours(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif);

    // Return the result of the service
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        meta: {
            min_hours: result.data!.minutes >= getForceMinWeekMinutes(req.header(FORCE_HEADER)!)
        },
        data: {
            ...result.data!,
            week_start: dateToUnix(result.data!.week_start),
            week_end: dateToUnix(result.data!.week_end)
        }
    });
}

export async function addOfficerHoursEntryController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {week_start, week_end, minutes} = req.body as AddOfficerHoursBodyType;

    // Call the service to add the hours
    const result = await addOfficerHoursEntry(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, unixToDate(week_start), unixToDate(week_end), minutes, res.locals.loggedOfficer);

    res.status(result.status).json({message: result.message});
}

export async function deleteOfficerGetHoursEntryController(req: express.Request, res: OfficerInfoAPIResponse) {
    const {id} = req.params;

    // Call the service to delete the hours
    const result = await deleteOfficerHoursEntry(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, parseInt(id));

    res.status(result.status).json({message: result.message});
}