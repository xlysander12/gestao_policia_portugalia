import {Request, NextFunction} from "express";
import {FORCE_HEADER} from "../utils/constants";
import {OfficerInfoAPIResponse} from "../types";
import {getOfficerData} from "../api/officers/repository";
import {isQueryParamPresent} from "../utils/filters";
import {getForcePatrolForces} from "../utils/config-handler";


async function officerExistsMiddle(req: Request, res: OfficerInfoAPIResponse, next: NextFunction) {
    // First, check if the officer is an active one
    let officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!);
    if (officerResult !== null) { // If it is, set the officer data and continue
        res.locals.targetOfficer = officerResult;
        res.locals.targetOfficer.force = req.header(FORCE_HEADER)!;
        res.locals.targetOfficer.isFormer = false;
        next();
        return;
    }

    // If it's not, check if it's a former officer
    officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!, true);

    if (officerResult !== null) {
        res.locals.targetOfficer = officerResult;
        res.locals.targetOfficer.isFormer = true;
        res.locals.targetOfficer.force = req.header(FORCE_HEADER)!;
        next();
        return;
    }

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

            // If the officer wasn't found, search in former officers of that force
            officerResult = await getOfficerData(Number(req.params.nif), force, true);
            if (officerResult !== null) {
                res.locals.targetOfficer = officerResult;
                res.locals.targetOfficer.force = force;
                res.locals.targetOfficer.isFormer = true;
                next();
                return;
            }
        }
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