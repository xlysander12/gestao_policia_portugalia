import express from "express";
import {FORCE_HEADER} from "../../../utils/constants";
import {forceIntents, forcePatents, forceSpecialUnits, forceStatuses} from "../services";
import {
    UtilIntentsResponse,
    UtilPatentsResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/util/schema";
import {ensureAPIResponseType} from "../../../utils/request-handler";

export async function getPatentsController(req: express.Request, res: express.Response) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the patents
    const result = await forcePatents(force);

    res.status(result.status).json(ensureAPIResponseType<UtilPatentsResponse>({message: result.message, data: result.data!}));
}

export async function getStatusesController(req: express.Request, res: express.Response) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceStatuses(force);

    // Send the list to the user
    res.status(result.status).json(ensureAPIResponseType<UtilStatusesResponse>({message: result.message, data: result.data!}));
}

export async function getSpecialUnitsController(req: express.Request, res: express.Response) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceSpecialUnits(force);

    // Send the list to the user
    res.status(result.status).json(ensureAPIResponseType<UtilSpecialUnitsResponse>({message: result.message, data: result.data!}));
}

export async function getIntentsController(req: express.Request, res: express.Response) {
    // Call the service to get the intents
    const result = await forceIntents(req.header(FORCE_HEADER)!);

    // Send the list to the user
    res.status(result.status).json(ensureAPIResponseType<UtilIntentsResponse>({message: result.message, data: result.data!}));
}