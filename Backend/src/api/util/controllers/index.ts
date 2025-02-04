import express from "express";
import {FORCE_HEADER} from "../../../utils/constants";
import {
    forceInactivityTypes,
    forceIntents,
    forcePatents,
    forcePatrolTypes,
    forceSpecialUnits,
    forceStatuses
} from "../services";
import {
    UtilInactivityTypesResponse,
    UtilIntentsResponse,
    UtilPatentsResponse, UtilPatrolTypesResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/util/output";
import {ExpressResponse} from "../../../types/response-types";

export async function getPatentsController(req: express.Request, res: ExpressResponse<UtilPatentsResponse>) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the patents
    const result = await forcePatents(force);

    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getStatusesController(req: express.Request, res: ExpressResponse<UtilStatusesResponse>) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceStatuses(force);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getSpecialUnitsController(req: express.Request, res: ExpressResponse<UtilSpecialUnitsResponse>) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceSpecialUnits(force);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getIntentsController(req: express.Request, res: ExpressResponse<UtilIntentsResponse>) {
    // Call the service to get the intents
    const result = await forceIntents(req.header(FORCE_HEADER)!);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getInactivityTypesController(req: express.Request, res: ExpressResponse<UtilInactivityTypesResponse>) {
    // Call the service to get the types
    const result = await forceInactivityTypes(req.header(FORCE_HEADER)!);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getPatrolTypesController(req: express.Request, res: ExpressResponse<UtilPatrolTypesResponse>) {
    // Call the service to get the types
    const result = await forcePatrolTypes(req.header(FORCE_HEADER)!);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}