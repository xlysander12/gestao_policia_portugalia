import express from "express";
import {queryDB} from "../../utils/db-connector";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
import {ChangeAccountInfoRequestBodyType} from "@portalseguranca/api-types/account/input";
import {FORCE_HEADER} from "../../utils/constants";
import {APIResponse} from "../../types";
import {getUserForces, userHasIntents} from "./repository";

const app = express.Router();

// Endpoint to edit an account's permissions / suspended statuses
app.patch("/:nif", async (req, res: APIResponse) => {
    const {suspended, intents} = req.body as ChangeAccountInfoRequestBodyType;

    // * First, check if 'suspended' is present
    if (suspended !== undefined) {
        // Update the user's suspended status
        await queryDB(req.header(FORCE_HEADER)!, 'UPDATE users SET suspended = ? WHERE nif = ?', [suspended ? "1" : "0", req.params.nif]);

        // If the account was set to be suspended, delete all tokens
        if (suspended) {
            await queryDB(req.header(FORCE_HEADER)!, 'DELETE FROM tokens WHERE nif = ?', [req.params.nif]);
        }
    }

    // * Second, check if 'intents' is present
    if (intents !== undefined) {
        // Get the intents names
        const intentsNames = Object.keys(intents);

        // Update intents in the database
        for (let i = 0; i < intentsNames.length; i++) {
            // Make sure the requesting user has the intent it wants to update and the intent to alter accounts
            if (!(await userHasIntents(res.locals.user!, req.header(FORCE_HEADER), intentsNames[i])) || !(await userHasIntents(res.locals.user!, req.header(FORCE_HEADER), "accounts"))) {
                let response: RequestError = {
                    message: "Não tens permissão para adicionar o intent " + intentsNames[i] + " a este utilizador"
                };
                return res.status(403).json(response);
            }

            // Check if the entry for this intent already exists
            if ((await queryDB(req.header(FORCE_HEADER)!, 'SELECT * FROM user_intents WHERE user = ? AND intent = ?', [req.params.nif, intentsNames[i]])).length === 0) { // Entry doesn't exist
                await queryDB(req.header(FORCE_HEADER)!, 'INSERT INTO user_intents (user, intent, enabled) VALUES (?, ?, ?)', [req.params.nif, intentsNames[i], intents[intentsNames[i]] ? "1" : "0"]);
            } else { // Entry already exists
                await queryDB(req.header(FORCE_HEADER)!, 'UPDATE user_intents SET enabled = ? WHERE user = ? AND intent = ?', [intents[intentsNames[i]] ? "1" : "0", req.params.nif, intentsNames[i]]);
            }
        }
    }

    let response: RequestSuccess = {
        message: "Account information updated successfully"
    }
    res.status(200).json(response);
});

// Endpoint to delete an account
// ! This endpoint will rarely be used since there's no big reason to need to delete an account
// ! If an account needs to be deleted, in theory, the officer linked to it should be fired
app.delete("/:nif", async (req, res) => {
    // * First, make sure the user exists in the selected force
    const requestedUserQuery = await queryDB(req.header(FORCE_HEADER)!, 'SELECT * FROM users WHERE nif = ?', [req.params.nif]);

    // If the user doesn't exist, return an error
    if (requestedUserQuery.length === 0) {
        let response: RequestError = {
            message: "O utilizador não existe"
        };
        return res.status(400).json(response);
    }

    // Since the user exists, delete it
    await queryDB(req.header(FORCE_HEADER)!, 'DELETE FROM users WHERE nif = ?', [req.params.nif]);

    // Return success
    let response: RequestSuccess = {
        message: "Conta eliminada com sucesso"
    };
    res.status(200).json(response);
});

// Endpoint to reset the password
app.post("/:nif/resetpassword", async (req, res) => {
    // * First, make sure the user exists in the selected force
    const requestedUserQuery = await queryDB(req.header(FORCE_HEADER)!, 'SELECT * FROM users WHERE nif = ?', [req.params.nif]);

    // If the user doesn't exist, return an error
    if (requestedUserQuery.length === 0) {
        let response: RequestError = {
            message: "O utilizador não existe"
        };
        return res.status(400).json(response);
    }

    // Since the user exists, confirm that it doesn't already use the default password
    if (requestedUserQuery[0].password === null) {
        let response: RequestError = {
            message: "Este utilizador já usa a palavra-passe padrão"
        };
        return res.status(400).json(response);
    }

    // Since the user exists and it has a custom passoword, reset it for every force it's in and clear all tokens
    for (const force of await getUserForces(Number(req.params.nif))) {
        await queryDB(force.name, 'UPDATE users SET password = ? WHERE nif = ?', [null, req.params.nif]);
        await queryDB(force.name, 'DELETE FROM tokens WHERE nif = ?', [req.params.nif]);
    }

    // Return success
    let response: RequestSuccess = {
        message: "Password resetada com sucesso"
    };
    res.status(200).json(response);
});

export default app;