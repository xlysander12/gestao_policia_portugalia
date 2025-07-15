import express from "express";

import {getAccountDetails} from "../api/accounts/repository";
import {AccountInfoAPIResponse} from "../types/response-types";
import {FORCE_HEADER} from "../utils/constants";

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

export default accountExistsMiddle;