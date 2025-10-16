import express from "express";
import {FORCE_HEADER} from "../../../utils/constants";
import {
    changeLastCeremony,
    errors, evaluationDecisions,
    evaluationFields,
    evaluationGrades, eventTypes, forceColors,
    forceInactivityTypes,
    forceIntents, forcePatentCategories,
    forcePatents, forcePatrolForces,
    forcePatrolTypes,
    forceSpecialUnits, forceSpecialUnitsActiveMembers,
    forceStatuses, forceTopHoursInWeek, lastCeremony, notifications
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
    UtilUserErrorsResponse,
    UtilEvaluationDecisionsResponse,
    UtilLastCeremonyResponse,
    UtilSpecialUnitsActiveResponse,
    UtilEventTypesResponse,
    ForceTopHoursInWeekResponse, UtilColorsResponse, UtilPatentCategoriesResponse
} from "@portalseguranca/api-types/util/output";
import {APIResponse, ExpressResponse, OfficerInfoAPIResponse} from "../../../types/response-types";
import {dateToUnix, unixToDate} from "../../../utils/date-handler";
import {ChangeLastCeremonyRequestBodyType} from "@portalseguranca/api-types/util/input";

export function getColorsController(req: express.Request, res: ExpressResponse<UtilColorsResponse>) {
    // Call the service
    const result = forceColors(req.header(FORCE_HEADER)!);

    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data
    });
}

export async function getPatentsController(req: express.Request, res: ExpressResponse<UtilPatentsResponse>) {
    // Get what force the user is trying to get the patents from
    const force = req.header(FORCE_HEADER)!;

    // Call the service to get the patents
    const result = await forcePatents(force);

    res.status(result.status).json({message: result.message, data: result.data!});
}

export async function getPatentCategoriesController(req: express.Request, res: ExpressResponse<UtilPatentCategoriesResponse>) {
    // Get what force the user is trying to get the patents from
    const force = req.header(FORCE_HEADER)!;

    // Call the service to get the patents
    const result = await forcePatentCategories(force);

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

export async function getSpecialUnitsActiveMembersController(req: express.Request, res: APIResponse<UtilSpecialUnitsActiveResponse>) {
    // Get the id of the unit from params
    const {id} = req.params;

    // Call the service
    const result = await forceSpecialUnitsActiveMembers(req.header(FORCE_HEADER)!, parseInt(id));

    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data!
    });
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

export async function getEvaluationDecisionsController(req: express.Request, res: ExpressResponse<UtilEvaluationDecisionsResponse>) {
    // Call the service
    const result = await evaluationDecisions(req.header(FORCE_HEADER)!);

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

export async function getEventTypesController(req: express.Request, res: ExpressResponse<UtilEventTypesResponse>) {
    // Call the service
    const result = await eventTypes(req.header(FORCE_HEADER)!);

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

export async function getLastCeremonyController(req: express.Request, res: ExpressResponse<UtilLastCeremonyResponse>) {
    // Call the service
    const result = await lastCeremony(req.header(FORCE_HEADER)!);

    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: dateToUnix(result.data!)
    });
}
export async function changeLastCeremonyController(req: express.Request, res: APIResponse) {
    const {timestamp} = req.body as ChangeLastCeremonyRequestBodyType;

    // Call the service
    const result = await changeLastCeremony(req.header(FORCE_HEADER)!, timestamp);

    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({message: result.message});
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

export async function getForceTopHoursInWeekController(req: express.Request, res: OfficerInfoAPIResponse<ForceTopHoursInWeekResponse>) {
    const {week_end} = req.query;

    // Call the service to get the top hours in the week
    const result = await forceTopHoursInWeek(req.header(FORCE_HEADER)!, unixToDate(parseInt(week_end as string)));

    // Return the result of the service
    if (!result.result) {
        res.status(result.status).json({message: result.message});
        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data!
    });
}