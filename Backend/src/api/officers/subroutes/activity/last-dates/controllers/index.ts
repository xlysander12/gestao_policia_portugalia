import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../../types";
import {getOfficerLastShift, updateOfficerLastShift} from "../services";
import {FORCE_HEADER} from "../../../../../../utils/constants";
import {OfficerLastDateResponse} from "@portalseguranca/api-types/officers/activity/output";
import {dateToUnix} from "../../../../../../utils/date-handler";
import { UpdateOfficerLastDateBodyType } from "@portalseguranca/api-types/officers/activity/input";

export async function getLastDateController(req: express.Request, res: OfficerInfoAPIResponse<OfficerLastDateResponse>) {
    // Get the field from the request parameters
    const {field} = req.params;

    // Call the service to get the last shift of the officer
    const result = await getOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, field);

    // * Return the result of the service
    // If the result is negative, return an error
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    // If the result is positive, return the last shift as a date string
    res.status(result.status).json({
        message: result.message,
        data: {
            date: dateToUnix(result.data!)
        }
    });
}

export async function updateLastDateController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Get the field from the request parameters
    const {field} = req.params;

    const {date} = req.body as UpdateOfficerLastDateBodyType;

    // Call the service to update the last shift
    const result = await updateOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, field, date);

    res.status(result.status).json({message: result.message});
}
