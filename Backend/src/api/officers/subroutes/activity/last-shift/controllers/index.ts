import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../../types";
import {getOfficerLastShift, updateOfficerLastShift} from "../services";
import {FORCE_HEADER, UPDATE_EVENTS} from "../../../../../../utils/constants";
import {OfficerLastShiftResponse} from "@portalseguranca/api-types/officers/activity/output";
import {dateToUnix} from "../../../../../../utils/date-handler";
import { UpdateOfficerLastShiftBodyType } from "@portalseguranca/api-types/officers/activity/input";
import {getForceMaxNonWorkingDays} from "../../../../../../utils/config-handler";

export async function getLastShiftController(req: express.Request, res: OfficerInfoAPIResponse<OfficerLastShiftResponse>) {
    // Call the service to get the last shift of the officer
    const result = await getOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif);

    // * Return the result of the service
    // If the result is negative, return an error
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    // If the result is positive, return the last shift as a date string
    res.status(result.status).json({
        message: result.message,
        meta: {
           passed_max_days: Date.now() > result.data!.getTime() + getForceMaxNonWorkingDays(req.header(FORCE_HEADER)!) * 24 * 60 * 60 * 1000
        },
        data: {
            last_shift: dateToUnix(result.data!)
        }
    });
}

export async function updateLastShiftController(req: express.Request, res: OfficerInfoAPIResponse) {
    let {last_shift} = req.body as UpdateOfficerLastShiftBodyType;

    // Call the service to update the last shift
    const result = await updateOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, last_shift ? new Date(last_shift): null);

    res.status(result.status).json({message: result.message!});
}
