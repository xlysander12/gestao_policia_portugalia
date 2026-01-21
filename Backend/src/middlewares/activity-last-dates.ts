import express from "express";
import {OfficerInfoAPIResponse} from "../types";
import {getForceLastDatesFields} from "../api/util/repository";
import {FORCE_HEADER} from "../utils/constants";

export default async function lastDateFieldExists(req: express.Request, res: OfficerInfoAPIResponse, next: express.NextFunction) {
    // Get the field from the params
    const { field } = req.params;

    // Get all the existing fields
    const fields = await getForceLastDatesFields(req.header(FORCE_HEADER)!);

    // Check if the field exists
    if (!fields.map(fieldObj => fieldObj.id).includes(field)) {
        res.status(400).json({
            message: `O campo "${field}" não é válido.`,
        });
        return;
    }

    next();
}