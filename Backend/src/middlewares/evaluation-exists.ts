import { getEvaluationData } from "../api/officers/subroutes/evaluations/repository";
import express from "express";
import {OfficerEvaluationAPIResponse} from "../types/response-types";
import {FORCE_HEADER} from "../utils/constants";
import {userHasIntents} from "../api/accounts/repository";

async function evaluationExistsMiddleware(req: express.Request, res: OfficerEvaluationAPIResponse, next: express.NextFunction) {
    // * Make sure the provided evaluation id is valid
    let evaluation = await getEvaluationData(req.header(FORCE_HEADER)!, parseInt(req.params["id"]));

    // If the evaluation doesn't exist, return an error
    if (evaluation === null) {
        res.status(404).json({
            message: "Avaliação não encontrada"
        });
        return;
    }

    // If the evaluation exists but the target officer isn't the one on the URL, return 404
    if (evaluation.target !== res.locals.targetOfficer!.nif) {
        res.status(404).json({
            message: "Avaliação não encontrada"
        });
        return;
    }

    // If the evaluation exists, but its author isn't the requesting officer, then the requesting officer must have the "evaluations" intent
    if (evaluation.author !== res.locals.loggedOfficer.nif) {
        if (!(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "evaluations"))) {
            res.status(403).json({
                message: "Não tens permissão para ver este recurso"
            });
            return;
        }
    }

    // Store the evaluation in the response locals
    res.locals.evaluation = {
        id: evaluation.id,
        target: evaluation.target,
        author: evaluation.author,
        patrol: evaluation.patrol,
        comments: evaluation.comments,
        timestamp: new Date(evaluation.timestamp),
        fields: evaluation.fields
    }

    next();
}

export default evaluationExistsMiddleware;