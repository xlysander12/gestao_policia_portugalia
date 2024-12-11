import express from "express";
import {FORCE_HEADER} from "../../../utils/constants";
import {forceIntents, forcePatents, forceSpecialUnits, forceStatuses} from "../services";
import {
    UtilIntentsResponse,
    UtilPatentsResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/util/schema";

export async function getPatentsController(req: express.Request, res: express.Response) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the patents
    const result = await forcePatents(force);

    // Send the response to the user
    res.send({message: "Operação bem sucedida", data: result.data} as UtilPatentsResponse);
}

export async function getStatusesController(req: express.Request, res: express.Response) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceStatuses(force);

    // Send the list to the user
    res.status(200).json({message: "Operação bem sucedida", data: result.data} as UtilStatusesResponse);
}

export async function getSpecialUnitsController(req: express.Request, res: express.Response) {
    // Get what force the user is trying to get the patents from
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceSpecialUnits(force);

    // Send the list to the user
    res.status(200).json({message: "Operação bem sucedida", data: result.data} as UtilSpecialUnitsResponse);
}

export async function getIntentsController(req: express.Request, res: express.Response) {
    let force = req.header(FORCE_HEADER)!;

    // Call the service to get the intents
    const intents = await forceIntents(force);


    // Send the list to the user
    res.status(200).json({message: "Operação bem sucedida", data: intents.data} as UtilIntentsResponse);
}