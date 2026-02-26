import {Request, NextFunction} from "express";
import {FORCE_HEADER} from "../utils/constants";
import {InnerOfficerData, OfficerInfoAPIResponse} from "../types";
import {getOfficerData} from "../api/officers/repository";
import {isQueryParamPresent} from "../utils/filters";
import {getForcePatrolForces} from "../utils/config-handler";


async function officerExistsMiddle(req: Request, res: OfficerInfoAPIResponse, next: NextFunction) {
    let officerResult: InnerOfficerData | null = null;

    // If this is the endpoint to fech an officer's data and the query parameter patrol is present, go through all forces the user can patrol with and check if the officer is in any of them
    if (res.locals.routeDetails.notes === "get_officer" && isQueryParamPresent("patrol", res.locals.queryParams) && res.locals.queryParams.patrol === "true") {
        for (const force of getForcePatrolForces(req.header(FORCE_HEADER)!)) {
            officerResult = await getOfficerData(Number(req.params.nif), force, false);
            if (officerResult !== null) {
                res.locals.targetOfficer = officerResult;
                res.locals.targetOfficer.force = force;
                res.locals.targetOfficer.isFormer = false;
                next();
                return;
            }
        }

        // If the officer is not found in any of the forces, search again as a former officer in all forces
        for (const force of getForcePatrolForces(req.header(FORCE_HEADER)!)) {
            officerResult = await getOfficerData(Number(req.params.nif), force, true);
            if (officerResult !== null) {
                res.locals.targetOfficer = officerResult;
                res.locals.targetOfficer.force = force;
                res.locals.targetOfficer.isFormer = true;
                next();
                return;
            }
        }
    } else {
        officerResult =
            (await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!, false)) ??
            (await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!, true));
    }

    // Set the officer data and continue
    if (officerResult !== null) {
        res.locals.targetOfficer = officerResult;
        next();
        return;
    }

    // If the officer doesn't exist, return a 404 status code, if the request is not to add a new officer
    // If it is to add a new officer, just continue with a null value in the locals
    if (res.locals.routeDetails.notes === "add_officer") {
        res.locals.targetOfficer = null;
        next();
        return;
    }

    res.status(404).json({
        message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
    });
    return;
}

export default officerExistsMiddle;