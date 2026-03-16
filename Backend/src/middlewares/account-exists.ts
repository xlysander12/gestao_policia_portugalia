import express from "express";

import {getAccountDetails, userHasIntents} from "../api/accounts/repository";
import {AccountInfoAPIResponse} from "../types/response-types";
import {FORCE_HEADER} from "../utils/constants";
import {getOfficerData} from "../api/officers/repository";
import {ChangeAccountInfoRequestBodyType} from "@portalseguranca/api-types/account/input";

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
    // - It's their own account, it's a PATCH, and they're ONLY changing login methods
    // - The user has the "accounts" intent
    // - The user has higher patent than the target account

    // If the requesting officer has the same NIF as the target account and they're only changing login methods, allow it
    // Only work this step if this is a PATCH request
    // ? This is hideous, but it works
    if (req.method === "PATCH") {
        if (
            res.locals.loggedOfficer.nif === res.locals.targetAccount.nif &&
            (
                (
                    (req.body as ChangeAccountInfoRequestBodyType).password_login !== undefined ||
                    (req.body as ChangeAccountInfoRequestBodyType).discord_login !== undefined
                ) && (
                    (req.body as ChangeAccountInfoRequestBodyType).suspended === undefined &&
                    (req.body as ChangeAccountInfoRequestBodyType).intents === undefined
                )
            )
        ) {
            next();
            return;
        }
    } else { // If not a PATCH request, allow it if it's their own account
        if (res.locals.loggedOfficer.nif === res.locals.targetAccount.nif) {
            next();
            return;
        }
    }

    // Ensure logged officer has the "accounts" intent
    if (!(await userHasIntents(res.locals.loggedOfficer.nif, req.header(FORCE_HEADER)!, "accounts"))) {
        res.status(403).json({
            message: "Não tem permissões para editar esta conta"
        });
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