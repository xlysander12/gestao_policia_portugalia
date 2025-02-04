import express from "express";
import {APIResponse, DefaultReturn} from "../../../types";
import {patrolCreate, patrolDelete, patrolEdit, patrolsHistory} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {isQueryParamPresent} from "../../../utils/filters";
import {MinifiedPatrolData, PatrolHistoryResponse, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import {RequestError} from "@portalseguranca/api-types";
import {PatrolInfoAPIResponse} from "../../../types/response-types";
import {dateToString} from "../../../utils/date-handler";
import {CreatePatrolBody, EditPatrolBody} from "@portalseguranca/api-types/patrols/input";

export async function listPatrolsController(req: express.Request, res: APIResponse<PatrolHistoryResponse | RequestError>) {
    // *  Call the service to get the patrols
    let result: DefaultReturn<{
        patrols: MinifiedPatrolData[],
        pages: number
    }>;

    // Check if there is a page parameter
    if (res.locals.queryParams && isQueryParamPresent("page", res.locals.queryParams)) {
        result = await patrolsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams, parseInt(res.locals.queryParams["page"]));
    } else {
        result = await patrolsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams);
    }

    // Return the result of the service
    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        meta: {
            pages: result.data!.pages,
        },
        message: result.message,
        data: result.data!.patrols
    });
}

export async function getPatrolController(req: express.Request, res: PatrolInfoAPIResponse<PatrolInfoResponse>) {
    const {force, ...patrolData} = res.locals.patrol;

    res.status(200).json({
        message: "Operação bem sucedida",
        data: {
            ...patrolData,
            id: `${res.locals.patrol.force}${res.locals.patrol.id}`,
            start: dateToString(res.locals.patrol.start),
            end: res.locals.patrol.end !== null ? dateToString(res.locals.patrol.end): null
        }
    });
}

export async function createPatrolController(req: express.Request, res: APIResponse) {
    const body = req.body as CreatePatrolBody;

    // Call the service to create the patrol
    const result = await patrolCreate(req.header(FORCE_HEADER)!, body, res.locals.loggedOfficer.nif);

    // Return the result
    res.status(result.status).json({
        message: result.message
    });
}

export async function editPatrolController(req: express.Request, res: PatrolInfoAPIResponse) {
    // Get the body from the request
    const body = req.body as EditPatrolBody;

    // Call the service to edit the patrol
    const result = await patrolEdit(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.patrol, body);

    // Return the result
    res.status(result.status).json({
        message: result.message
    });
}

export async function deletePatrolController(req: express.Request, res: PatrolInfoAPIResponse) {
    // Call the service to delete the patrol
    const result = await patrolDelete(res.locals.patrol.force, res.locals.patrol.id);

    // Return the result
    res.status(result.status).json({
        message: result.message
    });
}
