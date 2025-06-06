import express from "express";
import {APIResponse, DefaultReturn} from "../../../types";
import {patrolCreate, patrolDelete, patrolEdit, patrolsHistory, sortPatrolOfficers} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {isQueryParamPresent} from "../../../utils/filters";
import {MinifiedPatrolData, PatrolHistoryResponse, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import {PatrolInfoAPIResponse} from "../../../types/response-types";
import {dateToUnix} from "../../../utils/date-handler";
import {CreatePatrolBody, EditPatrolBody} from "@portalseguranca/api-types/patrols/input";

export async function listPatrolsController(req: express.Request, res: APIResponse<PatrolHistoryResponse>) {
    // *  Call the service to get the patrols
    let result: DefaultReturn<{
        patrols: MinifiedPatrolData[],
        pages: number
    }>;

    // Check if there is a page parameter
    if (isQueryParamPresent("page", res.locals.queryParams)) {
        result = await patrolsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams, parseInt(res.locals.queryParams.page));
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

    // Ensure the list of officers is sorted
    patrolData.officers = await sortPatrolOfficers(req.header(FORCE_HEADER)!, patrolData.officers);

    res.status(200).json({
        message: "Operação bem sucedida",
        meta: {
            editable: res.locals.patrol.editable!
        },
        data: {
            ...patrolData,
            id: `${res.locals.patrol.force}${res.locals.patrol.id}`,
            start: dateToUnix(res.locals.patrol.start),
            end: res.locals.patrol.end !== null ? dateToUnix(res.locals.patrol.end): null
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

export async function deletePatrolController(_req: express.Request, res: PatrolInfoAPIResponse) {
    // Call the service to delete the patrol
    const result = await patrolDelete(res.locals.patrol.force, res.locals.patrol.id);

    // Return the result
    res.status(result.status).json({
        message: result.message
    });
}
