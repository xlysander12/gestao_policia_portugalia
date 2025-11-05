import express from "express";
import {CeremonyDecisionAPIResponse} from "../types/response-types";
import {getCeremonyDecisionById} from "../api/officers/subroutes/evaluations/subroutes/ceremony_decisions/repository";
import {FORCE_HEADER} from "../utils/constants";

export async function ceremonyDecisionExistsMiddleware(req: express.Request, res: CeremonyDecisionAPIResponse, next: express.NextFunction) {
    const decision = await getCeremonyDecisionById(req.header(FORCE_HEADER)!, res.locals.targetOfficer!.nif, parseInt(req.params.id));

    // If the decision doesn't exist, or it does but the target officer isn't the one on the URL, return 404
    if (decision === null || decision.target !== res.locals.targetOfficer!.nif) {
        res.status(404).json({
            message: "Decisão não encontrada."
        });
        return;
    }

    // ? Someone can't check the decision whose target patent is higher than his?

    res.locals.decision = decision;

    next();
}