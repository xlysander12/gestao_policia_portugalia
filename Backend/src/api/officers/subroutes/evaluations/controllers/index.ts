import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../types";
import {
    authoredEvaluationsList,
    createEvaluation,
    deleteEvaluationService,
    evaluationsList,
    updateEvaluation
} from "../services";
import {FORCE_HEADER} from "../../../../../utils/constants";
import {
    AuthoredEvaluationsListResponse,
    EvaluationDetailResponse,
    EvaluationsListResponse
} from "@portalseguranca/api-types/officers/evaluations/output";
import {OfficerEvaluationAPIResponse} from "../../../../../types/response-types";
import {isQueryParamPresent} from "../../../../../utils/filters";
import {CreateEvaluationBodyType, EditEvaluationBodyType} from "@portalseguranca/api-types/officers/evaluations/input";

export async function getEvaluationsListController(req: express.Request, res: OfficerInfoAPIResponse<EvaluationsListResponse>) {
    // Call the service
    const result = isQueryParamPresent("page", res.locals.queryParams) ?
        await evaluationsList(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.targetOfficer!.nif, res.locals.routeDetails.filters!, res.locals.queryParams, parseInt(res.locals.queryParams.page)) :
        await evaluationsList(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.targetOfficer!.nif, res.locals.routeDetails.filters!, res.locals.queryParams);

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
            pages: result.data!.pages,
          averages: result.data!.averages
        },
        data: result.data!.evaluations
    });
}

export async function getAuthoredEvaluationsListController(req: express.Request, res: OfficerInfoAPIResponse<AuthoredEvaluationsListResponse>) {
    // Call the service
    const result = isQueryParamPresent("page", res.locals.queryParams) ?
        await authoredEvaluationsList(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.targetOfficer!.nif, res.locals.routeDetails.filters!, res.locals.queryParams, parseInt(res.locals.queryParams.page)) :
        await authoredEvaluationsList(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.targetOfficer!.nif, res.locals.routeDetails.filters!, res.locals.queryParams);

    // Send the response
    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        meta: {
            pages: result.data!.pages
        },
        message: result.message,
        data: result.data!.evaluations
    });
}

export function getEvaluationDataController(_req: express.Request, res: OfficerEvaluationAPIResponse<EvaluationDetailResponse>) {
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

export async function createEvaluationController(req: express.Request, res: OfficerInfoAPIResponse) {
    const body = req.body as CreateEvaluationBodyType;

    // Call the service
    const result = await createEvaluation(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.targetOfficer!, body);

    res.status(result.status).json({
        message: result.message
    });
}

export async function editEvaluationController(req: express.Request, res: OfficerEvaluationAPIResponse) {
    const body = req.body as EditEvaluationBodyType;

    // Call the service
    const result = await updateEvaluation(req.header(FORCE_HEADER)!,res.locals.loggedOfficer, res.locals.evaluation, body);

    // Send the response
    res.status(result.status).json({
        message: result.message
    });
}

export async function deleteEvaluationController(req: express.Request, res: OfficerEvaluationAPIResponse) {
    // Call the service
    const result = await deleteEvaluationService(req.header(FORCE_HEADER)!, res.locals.loggedOfficer, res.locals.evaluation);

    // Send the response
    res.status(result.status).json({
        message: result.message
    });
}