import express from "express";
import {FORCE_HEADER} from "../utils/constants";
import {getAccountDetails} from "../api/accounts/repository";
import {AccountInfoAPIResponse} from "../types/response-types";

async function accountExistsMiddle(req: express.Request, res: AccountInfoAPIResponse, next: express.NextFunction) {
    let {nif} = req.params;

    let accountResult = await getAccountDetails(Number(nif), req.header(FORCE_HEADER)!);
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

export default accountExistsMiddle;