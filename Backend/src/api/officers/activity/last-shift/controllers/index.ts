import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {getOfficerLastShift} from "../services";
import {FORCE_HEADER} from "../../../../../utils/constants";
import { RequestError } from "@portalseguranca/api-types";
import {OfficerLastShiftResponse} from "@portalseguranca/api-types/officers/activity/output";
import {dateToString} from "../../../../../utils/date-handler";

export async function getLastShiftController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Call the service to get the last shift of the officer
    const result = await getOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif);

    // * Return the result of the service
    // If the result is negative, return an error
    if (!result.result) {
        return res.status(result.status).json({message: result.message} as RequestError);
    }

    // If the result is positive, return the last shift as a date string
    return res.status(result.status).json({
        message: "Operação bem sucedida",
        data: {
            last_shift: dateToString(result.data!, false)
        }
    } as OfficerLastShiftResponse);
}