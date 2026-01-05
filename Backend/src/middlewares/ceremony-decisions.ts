import express from "express";
import {CeremonyDecisionAPIResponse} from "../types/response-types";
import {getCeremonyDecisionById} from "../api/officers/subroutes/evaluations/subroutes/ceremony_decisions/repository";
import {FORCE_HEADER} from "../utils/constants";
import {PatentData} from "@portalseguranca/api-types/util/output";
import {getForcePatents} from "../api/util/repository";

export async function ceremonyDecisionExistsMiddleware(req: express.Request, res: CeremonyDecisionAPIResponse, next: express.NextFunction) {
    const decision = await getCeremonyDecisionById(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, parseInt(req.params.id));

    // If the decision doesn't exist, or it does but the target officer isn't the one on the URL, return 404
    if (decision === null || decision.target !== res.locals.targetOfficer!.nif) {
        res.status(404).json({
            message: "Decisão não encontrada."
        });
        return;
    }

    res.locals.decision = decision;

    next();
}

export async function ceremonyDecisionCanBeViewedMiddleware(req: express.Request, res: CeremonyDecisionAPIResponse, next: express.NextFunction) {
    // ! An user can't see the details of a decision whose target has higher patent than the user can evaluate
    const user_max_evaluation_patent = ((await getForcePatents(req.header(FORCE_HEADER)!, res.locals.loggedOfficer.patent)) as PatentData).max_evaluation;
    if (res.locals.targetOfficer!.patent > user_max_evaluation_patent) {
        res.status(403).json({
            message: "Não tens permissão para consultar estes dados."
        });
        return;
    }

    next();
}