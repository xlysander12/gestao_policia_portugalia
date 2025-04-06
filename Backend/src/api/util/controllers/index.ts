import express from "express";
import {FORCE_HEADER} from "../../../utils/constants";
import {
    errors,
    evaluationFields,
    evaluationGrades,
    forceInactivityTypes,
    forceIntents,
    forcePatents, forcePatrolForces,
    forcePatrolTypes,
    forceSpecialUnits,
    forceStatuses, notifications
} from "../services";
import {
    UtilInactivityTypesResponse,
    UtilIntentsResponse,
    UtilPatentsResponse,
    UtilPatrolTypesResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse,
    UtilForcePatrolForcesResponse,
    UtilNotificationsResponse,
    UtilEvaluationGradesResponse,
    UtilEvaluationFieldsResponse,
    UtilUserErrorsResponse
} from "@portalseguranca/api-types/util/output";
import {APIResponse, ExpressResponse} from "../../../types/response-types";
import {dateToUnix} from "../../../utils/date-handler";

export async function getPatentsController(req: express.Request, res: ExpressResponse<UtilPatentsResponse>) {
    // Get what force the user is trying to get the patents from
    const force = req.header(FORCE_HEADER)!;

    // Call the service to get the patents
    const result = await forcePatents(force);

    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getStatusesController(req: express.Request, res: ExpressResponse<UtilStatusesResponse>) {
    // Get what force the user is trying to get the patents from
    const force = req.header(FORCE_HEADER)!;

    // Call the service to get the statuses
    const result = await forceStatuses(force);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getSpecialUnitsController(req: express.Request, res: ExpressResponse<UtilSpecialUnitsResponse>) {
    // Get what force the user is trying to get the patents from
    const force = req.header(FORCE_HEADER)!;

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

export function getPatrolForcesController(req: express.Request, res: ExpressResponse<UtilForcePatrolForcesResponse>) {
    // Call the service to get the types
    const result = forcePatrolForces(req.header(FORCE_HEADER)!);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getEvaluationGradesController(req: express.Request, res: ExpressResponse<UtilEvaluationGradesResponse>) {
    // Call the service
    const result = await evaluationGrades(req.header(FORCE_HEADER)!);

    // Send the list to the client
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data!
    });
}

export async function getEvaluationFieldsController(req: express.Request, res: ExpressResponse<UtilEvaluationFieldsResponse>) {
    // Call the service
    const result = await evaluationFields(req.header(FORCE_HEADER)!);

    // Send the list to the client
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data!
    });
}

export async function getNotificationsController(req: express.Request, res: APIResponse<UtilNotificationsResponse>) {
    // Call the service to get the notifications
    const result = await notifications(req.header(FORCE_HEADER)!, res.locals.loggedOfficer.nif);

    // Send the list to the user
    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getUserErrorsController(req: express.Request, res: APIResponse<UtilUserErrorsResponse>) {
    // Call the service to get the errors
    const result = await errors(req.header(FORCE_HEADER)!, res.locals.loggedOfficer.nif);

    res.status(result.status);

    if (!result.result) {
        res.json({message: result.message});
        return;
    }

    res.json({
        message: result.message,
        data: result.data!.map(error => ({
            code: error.code,
            timestamp: dateToUnix(error.timestamp)
        }))
    });
}