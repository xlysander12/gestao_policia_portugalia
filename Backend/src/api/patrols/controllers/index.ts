import express from "express";
import {APIResponse, DefaultReturn} from "../../../types";
import {patrolsHistory} from "../services";
import {FORCE_HEADER} from "../../../utils/constants";
import {isQueryParamPresent} from "../../../utils/filters";
import {ensureAPIResponseType} from "../../../utils/request-handler";
import {MinifiedPatrolData, PatrolHistoryResponse} from "@portalseguranca/api-types/patrols/output";
import { RequestError } from "@portalseguranca/api-types";

export async function listPatrolsController(req: express.Request, res: APIResponse) {
    // *  Call the service to get the patrols
    let result: DefaultReturn<MinifiedPatrolData[]>;

    // Check if there is a page parameter
    if (res.locals.queryParams && isQueryParamPresent("page", res.locals.queryParams)) {
        result = await patrolsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams, parseInt(res.locals.queryParams["page"]));
    } else {
        result = await patrolsHistory(req.header(FORCE_HEADER)!, res.locals.routeDetails.filters!, res.locals.queryParams);
    }

    // Return the result of the service
    if (!result.result) {
        res.status(result.status).json(ensureAPIResponseType<RequestError>({
            message: result.message
        }));
        return;
    }

    res.status(result.status).json(ensureAPIResponseType<PatrolHistoryResponse>({
        message: result.message,
        data: result.data!
    }));
}