import { getEvaluationData } from "../api/officers/subroutes/evaluations/repository";
import express from "express";
import {OfficerEvaluationAPIResponse, OfficerInfoAPIResponse} from "../types/response-types";
import {FORCE_HEADER} from "../utils/constants";
import {userHasIntents} from "../api/accounts/repository";
import {getOfficerData} from "../api/officers/repository";
import {getForcePatents} from "../api/util/repository";
import {PatentData} from "@portalseguranca/api-types/util/output";

async function evaluationExistsMiddleware(req: express.Request, res: OfficerEvaluationAPIResponse, next: express.NextFunction) {
    // * Make sure the provided evaluation id is valid
    const evaluation = await getEvaluationData(req.header(FORCE_HEADER)!, parseInt(req.params.id));

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

    // If the evaluation exists but its author isn't the requesting officer, a few checks need to be done
    // - The requesting officer must have the "evaluations" intent
    // - The author officer cannot be higher patent than the requesting officer
    if (evaluation.author !== res.locals.loggedOfficer.nif) {
        if (!(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "evaluations"))) {
            res.status(403).json({
                message: "Não tens permissão para aceder a este recurso"
            });
            return;
        }

        // Getting the details of the author
        const author = await getOfficerData(evaluation.author, req.header(FORCE_HEADER)!, false, false) ??
            await getOfficerData(evaluation.author, req.header(FORCE_HEADER)!, true, false);

        // If the author doesn't exist, return an error
        if (!author) {
            res.status(404).json({
                message: "Avaliação não encontrada"
            });
            return;
        }

        // If the author is higher patent than the requesting officer, return an error
        if (author.patent > res.locals.loggedOfficer.patent) {
            res.status(403).json({
                message: "Não tens permissão para aceder a este recurso"
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
        decision: evaluation.decision,
        timestamp: new Date(evaluation.timestamp),
        fields: evaluation.fields
    }

    next();
}

export async function canCheckEvalsMiddleware(req: express.Request, res: OfficerInfoAPIResponse, next: express.NextFunction) {
    // Check if the target's patent is within the logged officer's max evaluation patent
    const loggedPatent = (await getForcePatents(req.header(FORCE_HEADER)!, res.locals.loggedOfficer.patent) as PatentData);
    if (res.locals.targetOfficer!.patent > loggedPatent.max_evaluation) {
        res.status(403).json({
            message: "Não tens permissão para aceder a este recurso"
        });
        return;
    }

    next();
}

export default evaluationExistsMiddleware;