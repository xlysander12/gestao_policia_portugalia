import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {getOfficerLastShift, updateOfficerLastShift} from "../services";
import {FORCE_HEADER} from "../../../../../utils/constants";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
import {OfficerLastShiftResponse} from "@portalseguranca/api-types/officers/activity/output";
import {dateToString} from "../../../../../utils/date-handler";
import {ensureAPIResponseType} from "../../../../../utils/request-handler";
import { UpdateOfficerLastShiftBodyType } from "@portalseguranca/api-types/officers/activity/input";

export async function getLastShiftController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Call the service to get the last shift of the officer
    const result = await getOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif);

    // * Return the result of the service
    // If the result is negative, return an error
    if (!result.result) {
        return res.status(result.status).json({message: result.message} as RequestError);
    }

    // If the result is positive, return the last shift as a date string
    return res.status(result.status).json(ensureAPIResponseType<OfficerLastShiftResponse>({
        message: "Operação bem sucedida",
        data: {
            last_shift: dateToString(result.data!, false)
        }
    }));
}

export async function updateLastShiftController(req: express.Request, res: OfficerInfoAPIResponse) {
    let {last_shift} = req.body as UpdateOfficerLastShiftBodyType;

    // Call the service to update the last shift
    const result = await updateOfficerLastShift(req.header(FORCE_HEADER)!, res.locals.targetOfficer.nif, new Date(Date.parse(last_shift)));

    res.status(result.status).json(ensureAPIResponseType<RequestSuccess>({message: result.message!}));
}
