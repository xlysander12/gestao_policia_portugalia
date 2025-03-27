import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {evaluationsList} from "../services";
import {FORCE_HEADER} from "../../../../../utils/constants";
import {
    EvaluationDetailResponse,
    EvaluationsListResponse
} from "@portalseguranca/api-types/officers/evaluations/output";
import {OfficerEvaluationAPIResponse} from "../../../../../types/response-types";

export async function getEvaluationsListController(req: express.Request, res: OfficerInfoAPIResponse<EvaluationsListResponse>) {
    // Call the service
    const result = await evaluationsList(req.header(FORCE_HEADER)!, res.locals.loggedOfficer.nif, res.locals.targetOfficer!.nif, res.locals.routeDetails.filters!, res.locals.queryParams);

    // Send the response
    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        message: result.message,
        meta: {
          averages: result.data!.averages
        },
        data: result.data!.evaluations
    });
}

export async function getEvaluationDataController(req: express.Request, res: OfficerEvaluationAPIResponse<EvaluationDetailResponse>) {
    // Send the response
    res.status(200).json({
        message: "Operação realizada com sucesso",
        data: {
            id: res.locals.evaluation.id,
            target: res.locals.evaluation.target,
            author: res.locals.evaluation.author,
            patrol: res.locals.evaluation.patrol,
            comments: res.locals.evaluation.comments,
            timestamp: res.locals.evaluation.timestamp.getTime(),
            fields: res.locals.evaluation.fields,
        }
    });
}