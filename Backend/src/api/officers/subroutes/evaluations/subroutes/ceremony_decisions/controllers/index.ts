import express from "express";
import {OfficerInfoAPIResponse} from "../../../../../../../types";
import {FORCE_HEADER} from "../../../../../../../utils/constants";
import {ceremonyDecisions} from "../services";
import {CeremonyDecisionsListResponse} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";


export async function getCeremonyDecisionsController(req: express.Request, res: OfficerInfoAPIResponse<CeremonyDecisionsListResponse>) {
    // Call the service to get the data
    const result = await ceremonyDecisions(req.header(FORCE_HEADER)!, res.locals.targetOfficer!, res.locals.routeDetails.filters!, res.locals.queryParams);

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