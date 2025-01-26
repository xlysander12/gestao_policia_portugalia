import {Request, NextFunction} from "express";
import {FORCE_HEADER} from "../utils/constants";
import {InnerOfficerData, OfficerInfoAPIResponse} from "../types";
import {getOfficerData} from "../api/officers/repository";


async function officerExistsMiddle(req: Request, res: OfficerInfoAPIResponse, next: NextFunction) {
    // First, check if the officer is an active one
    let officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!);
    if (officerResult !== null) { // If it is, set the officer data and continue
        res.locals.targetOfficer = officerResult as InnerOfficerData;
        next();
        return;
    }

    // If it's not and the request URL is just to get the data of the officer, add a new officer or to restore a former officer, check if it's a former officer
    if ((res.locals.routeDetails.notes === "basic_get" || res.locals.routeDetails.notes === "add_officer" || res.locals.routeDetails.notes === "restore_officer")) {
        officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!, true);

        if (officerResult !== null) {
            res.locals.targetOfficer = officerResult as InnerOfficerData;
            res.locals.targetOfficer.isFormer = true;
            next();
            return;
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