import express from "express";
import {queryDB} from "../../utils/db-connector";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
import {FORCE_HEADER} from "../../utils/constants";
import {getUserForces} from "./repository";

const app = express.Router();

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