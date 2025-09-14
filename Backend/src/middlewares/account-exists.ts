import express from "express";

import {getAccountDetails} from "../api/accounts/repository";
import {AccountInfoAPIResponse} from "../types/response-types";
import {FORCE_HEADER} from "../utils/constants";
import {getOfficerData} from "../api/officers/repository";

async function accountExistsMiddle(req: express.Request, res: AccountInfoAPIResponse, next: express.NextFunction) {
    const {nif} = req.params;

    const accountResult = await getAccountDetails(parseInt(nif), req.header(FORCE_HEADER)!);
    if (accountResult === null) {
        res.status(404).json({
            message: "Utilizador não encontrado"
        });
        return;
    }

    // If the account was found, add it to the response locals
    res.locals.targetAccount = accountResult;

    next();
}

export async function canUserEditAccount(req: express.Request, res: AccountInfoAPIResponse, next: express.NextFunction) {
    // For an user to be able to edit an account, the following conditions must be true
    // - The user has the "accounts" intent (this is handled by the routes file)
    // - The user has higher patent than the target account

    // If the requesting officer has the same NIF as the target account, allow it
    if (res.locals.loggedOfficer.nif === res.locals.targetAccount.nif) {
        next();
        return;
    }

    // Get officer data of the target account
    const targetData = await getOfficerData(res.locals.targetAccount.nif, req.header(FORCE_HEADER)!, false, false);

    if (res.locals.loggedOfficer.patent <= targetData!.patent) {
        res.status(403).json({
            message: "Não tem permissões para editar esta conta"
        });
        return;
    }

    next();
}


export default accountExistsMiddle;