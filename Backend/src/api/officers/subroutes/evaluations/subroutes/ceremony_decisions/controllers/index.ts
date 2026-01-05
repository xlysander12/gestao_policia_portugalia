import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../../../types";
import {FORCE_HEADER} from "../../../../../../../utils/constants";
import {ceremonyDecisions, createDecision} from "../services";
import {
    CeremonyDecisionInfoResponse,
    CeremonyDecisionsListResponse
} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import {CreateCeremonyDecisionBody} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/input";
import {dateToUnix, unixToDate} from "../../../../../../../utils/date-handler";
import {CeremonyDecisionAPIResponse} from "../../../../../../../types/response-types";
import {isQueryParamPresent} from "../../../../../../../utils/filters";


export async function getCeremonyDecisionsController(req: express.Request, res: OfficerInfoAPIResponse<CeremonyDecisionsListResponse>) {
    // Call the service to get the data
    const result = await ceremonyDecisions(req.header(FORCE_HEADER)!,
        res.locals.targetOfficer!,
        res.locals.routeDetails.filters!,
        res.locals.queryParams,
        isQueryParamPresent("page", res.locals.queryParams) ? parseInt(res.locals.queryParams.page) : undefined
    );

    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        message: result.message,
        meta: {
            pages: result.data!.pages
        },
        data: result.data!.decisions
    });
}

export function getCeremonyDecisionByIdController(req: express.Request, res: CeremonyDecisionAPIResponse<CeremonyDecisionInfoResponse>) {
    // The decision is already loaded by the middleware, so just send it back
    res.status(200).json({
        message: "Operação concluída com sucesso.",
        data: res.locals.decision
    });
}


export async function createCeremonyDecisionController(req: express.Request, res: OfficerInfoAPIResponse) {
    // Get the data from the request body
    const {category, ceremony, decision, details} = req.body as CreateCeremonyDecisionBody;

    // Call the service with the data
    const result = await createDecision(req.header(FORCE_HEADER)!, res.locals.targetOfficer!, category, unixToDate(ceremony), decision, details);

    // Send the response
    res.status(result.status).json({
        message: result.message
    });
}