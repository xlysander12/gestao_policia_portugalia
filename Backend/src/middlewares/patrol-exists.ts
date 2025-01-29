import express from "express";
import {PatrolInfoAPIResponse} from "../types/response-types";
import {getPatrol} from "../api/patrols/repository";
import {FORCE_HEADER} from "../utils/constants";
import {ensureAPIResponseType} from "../utils/request-handler";
import { RequestError } from "@portalseguranca/api-types";

async function patrolExistsMiddle(req: express.Request, res: PatrolInfoAPIResponse, next: express.NextFunction) {
    // Fetch the patrol from the database
    const patrol = await getPatrol(req.header(FORCE_HEADER)!, req.params.id);

    // If the patrol doesn't exist, return a 404 status code
    if (patrol === null) {
        res.status(404).json(ensureAPIResponseType<RequestError>({
            message: "Não foi encontrada nenhuma patrulha com o ID fornecido."
        }));
        return;
    }

    // Otherwise, set the patrol data and continue
    res.locals.patrol = patrol;
    next();

}

export default patrolExistsMiddle;