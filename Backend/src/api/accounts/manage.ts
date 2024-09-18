import express from "express";
import {getUserForces, userHasIntents} from "../../utils/user-handler";
import {queryDB} from "../../utils/db-connector";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";

const app = express.Router();

// Endpoint to create an account
app.post("/:nif", async (req, res) => {
    // TODO: Implement this endpoint to create a new account
    const {nif} = req.params;

    // First, make sure this user doesn't already have an account
    const user_forces = await getUserForces(Number(nif));
    if (user_forces.length > 0 ) {
        let response: RequestError = {
            message: "O utilizador já tem uma conta"
        };
        return res.status(400).json(response);
    }

    // Then, make sure the officer exists in the force (there can't be accounts for non-existing officers)
    const officer = await queryDB(req.header("x-portalseguranca-force"), 'SELECT * FROM officers WHERE nif = ?', [nif]);
    if (officer.length === 0) {
        let response: RequestError = {
            message: "Não é possível criar uma conta para um efetivo que não existe"
        };
        return res.status(400).json(response);
    }

    // Add the account in the force's DB
    await queryDB(req.header("x-portalseguranca-force"), 'INSERT INTO users (nif) VALUES (?)', [nif]);

    // Return success
    let response: RequestSuccess = {
        message: "Conta criada com sucesso"
    };
    res.status(200).json(response);
});

// Endpoint to reset the password
app.post("/:nif/resetpassword", async (req, res) => {
    // TODO: Implement this endpoint to reset user's password
});

app.patch("/:nif/intents", async (req, res) => {
    const intents  = Object.keys(req.body);

    // Update intents in the database
    for (let i = 0; i < intents.length; i++) {
        // Make sure the requesting user has the intent it wants to update and the intent to alter accounts
        if(!(await userHasIntents(res.locals.user, req.header("x-portalseguranca-force"), intents[i])) || !(await userHasIntents(res.locals.user, req.header("x-portalseguranca-force"), "accounts"))) {
            let response: RequestError = {
                message: "Não tens permissão para efetuar esta ação"
            };
            return res.status(403).json(response);
        }

        // Check if the entry for this intent already exists
        if ((await queryDB(req.header("x-portalseguranca-force"), 'SELECT * FROM user_intents WHERE user = ? AND intent = ?', [req.params.nif, intents[i]])).length === 0) { // Entry doesn't exist
            await queryDB(req.header("x-portalseguranca-force"), 'INSERT INTO user_intents (user, intent, enabled) VALUES (?, ?, ?)', [req.params.nif, intents[i], req.body[intents[i]] ? "1" : "0"]);
        } else { // Entry already exists
            await queryDB(req.header("x-portalseguranca-force"), 'UPDATE user_intents SET enabled = ? WHERE user = ? AND intent = ?', [req.body[intents[i]] ? "1" : "0", req.params.nif, intents[i]]);
        }
    }

    let response: RequestSuccess = {
        message: "Intents updated successfully"
    }
    res.status(200).json(response);
});

export default app;