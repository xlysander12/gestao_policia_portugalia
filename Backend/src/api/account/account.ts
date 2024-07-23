import express from 'express';
const app = express.Router();

// Import utils
import {checkTokenValidityIntents, generateToken} from "../../utils/token-handler";
import {queryDB} from "../../utils/db-connector";

// Import constants
import {FORCES} from "../../utils/constants";
import {AccountInfoResponse, ValidateTokenPostResponse} from "@portalseguranca/api-types/api/account/schema";
import {RequestError} from "@portalseguranca/api-types/api/schema";

// Endpoint to valide a Token and check if the user has the correct permissions
app.post("/validateToken", async (req, res) => {
    let validation = await checkTokenValidityIntents(req.headers.authorization, <string>req.headers["x-portalseguranca-force"], req.body.intent);

    if (!validation[0]) {
        res.status(validation[1]).json({
            message: validation[2]
        });
        return;
    }


    // If everything is correct, build the response and return a 200 status code
    let response: ValidateTokenPostResponse = {
        message: "Operação bem sucedida",
        data: Number(validation[2])
    };

    return res.status(200).json(response);
});

// Endpoint to login an user
// TODO: Re-do this endpoint. There is code repetition
// TODO: The login endpoint needs to check which force the user belongs to or even all of them
// TODO: This endpoint should implement the "remember me" functionality
app.post("/login", async (req, res) => {
    // Check if the request has the correct body
    if (!req.body.nif || !req.body.password) {
        res.status(400).json({
            message: "Não foi fornecido um username ou password",
        });
        return;
    }

    // Check if the user exists (it's needed to check on all forces databases)
    let found_results = [];

    // Getting the row corresponding the nif and adding it to the found_results array
    for (const force of FORCES) {
        const passwordResult = await queryDB(force, 'SELECT password FROM users WHERE nif = ?', req.body.nif);
        found_results.push(...passwordResult);
    }

    // If the found_results array is empty, then the username doesn't exist
    if (found_results.length === 0) {
        res.status(401).json({
            message: "O username fornecido não existe."
        });
        return;
    }

    let valid_login;

    // If the password is NULL, then the correct password would be "seguranca"
    if (found_results[0].password === null) {
        valid_login = req.body.password === "seguranca";
    } else {
        // If the password is not NULL, check if it is correct
        valid_login = found_results[0].password === req.body.password; // TODO: Hash password
    }


    // If the password is incorrect, return a 401 status code
    if (!valid_login) {
        res.status(401).json({
            message: "Password incorreta"
        });
        return;
    }

    // If everything is correct, generate a token
    const token = await generateToken();

    // After generating the token, store it in the databases of the forces the user belongs to
    for (const force of FORCES) {
        try {
            await queryDB(force, 'INSERT INTO tokens (token, nif) VALUES (?, ?)', [token, req.body.nif]);
        } catch (e) { // This error would only be if trying to store a token for an user that doesn't exist
            res.status(500).json({
                message: "Erro ao tentar guardar o token"
            });

            return;
        }

    }

    // Send the token to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: token
    });
});

// Patch Endpoint to change password
app.patch("/login", async (req, res) => {
    // TODO: Implement this endpoint to change user's password
});

// Endpoint to get a user's account information
app.get("/info/:nif", async (req, res) => {
    // First, make sure the request is well made and a token + force header are present
    let validation = await checkTokenValidityIntents(req.headers.authorization, <string>req.headers["x-portalseguranca-force"]);
    if (!validation[0]) { // Make sure the token exists
        let response: RequestError = {
            message: validation[2]
        };
        res.status(validation[1]).json(response);
        return;
    }

    // Since the token existis and it's valid, get the requesting user's nif
    let requestingUser = Number(validation[2]);

    // Check if the requesting user is the user itself
    if (requestingUser !== Number(req.params.nif)) {
        // If it's not the user itself, check if the user has the "accounts" intent
        let hasIntent = await checkTokenValidityIntents(req.headers.authorization, <string>req.headers["x-portalseguranca-force"], "accounts");
        if (!hasIntent[0]) {
            let response: RequestError = {
                message: hasIntent[2]
            };
            res.status(hasIntent[1]).json(response);
            return;
        }
    }

    // Since the user has permission, get the requested permissions from database.
    let response: AccountInfoResponse = {
        message: "Operação bem sucedida",
        data: {
            defaultPassword: false,
            intents: {}
        }
    };

    // Check if the password is the default one
    const passwordQuery = await queryDB(req.header("x-portalseguranca-force"), 'SELECT password FROM users WHERE nif = ?', req.params.nif);

    // If no user exists, return 404
    if (passwordQuery.length === 0) {
        const response: RequestError = {
            message: "O utilizador requisitado não existe"
        }
        return res.status(404).json(response);
    }
    
    response.data.defaultPassword = passwordQuery[0].password === null;

    // Get all possible intents
    const intentsQuery = await queryDB(req.header("x-portalseguranca-force"), 'SELECT name FROM intents');
    const intents: string[] = intentsQuery.map((intent) => intent.name);

    // After getting all intents, default them to false in the response
    intents.forEach((intent) => {
        response.data.intents[intent] = false;
    });

    // Get the user's permissions
    const userIntentsQuery = await queryDB(req.header("x-portalseguranca-force"), 'SELECT intent, enabled FROM user_intents WHERE user = ?', req.params.nif);
    userIntentsQuery.forEach((intent) => {
        response.data.intents[intent.intent] = Boolean(intent.enabled);
    });

    // Return the response
    res.status(200).json(response);
});

module.exports = app;

console.log("[Portal Segurança] Account routes loaded successfully!")