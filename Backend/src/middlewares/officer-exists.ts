import {Request, NextFunction} from "express";
import {FORCE_HEADER} from "../utils/constants";
import {OfficerInfoAPIResponse} from "../types";
import {getOfficerData} from "../api/officers/repository";
import {userHasIntents} from "../api/accounts/repository";


async function officerExistsMiddle(req: Request, res: OfficerInfoAPIResponse, next: NextFunction) {
    // First, check if the officer is an active one
    let officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!);
    if (officerResult !== null) { // If it is, set the officer data and continue
        res.locals.targetOfficer = officerResult;
        next();
        return;
    }

    // If it's not and the request URL is just to get the data of the officer, check if it's a former officer
    // This should only be done if the logged officer has the "officers" intent
    if (res.locals.routeDetails.notes === "basic_get" && await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, ["officers"])) {
        officerResult = await getOfficerData(Number(req.params.nif), req.header(FORCE_HEADER)!, true);

        if (officerResult !== null) {
            res.locals.targetOfficer = officerResult;
            res.locals.targetOfficerFormer = true;
            next();
            return;
        }
    }

    // If the officer doesn't exist, return a 404 status code
    res.status(404).json({
        message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
    });
    return;




}

export default officerExistsMiddle;