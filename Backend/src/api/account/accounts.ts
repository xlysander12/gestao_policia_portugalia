// Import packages
import express from 'express';
import {compare, hash} from 'bcrypt';

// Import utils
import {generateToken, getUserForces, userHasIntents} from "../../utils/user-handler";
import {queryDB} from "../../utils/db-connector";

// Import constants
import {AccountInfoResponse, LoginResponse, ValidateTokenResponse} from "@portalseguranca/api-types/api/account/schema";
import {RequestError} from "@portalseguranca/api-types/api/schema";

const app = express.Router();

// Endpoint to validate a Token and check if the user has the correct permissions
app.post("/validateToken", async (req, res) => {
    // Check if intents were provided
    if (req.body.intents) { // If intents were provided, check if the user has them
        let hasIntents = await userHasIntents(Number(req.header("x-portalseguranca-user")), req.header("x-portalseguranca-force"), req.body.intents);
        if (!hasIntents) { // If the user doesn't have intents, return a 403
            let response: RequestError = {
                message: "Não tens esta permissão"
            };
            return res.status(403).json(response);
        }
    }

    // Since the user has the request intents, return the token as valid
    let response: ValidateTokenResponse = {
        message: "Operação bem sucedida",
        data: Number(req.header("x-portalseguranca-user"))
    };
    return res.status(200).json(response);

});

// Endpoint to login an user
// TODO: This endpoint should implement the "remember me" functionality
app.post("/login", async (req, res) => {
    // Check if the user exists (it's needed to check on all forces databases)
    let user_forces = await getUserForces(req.body.nif, true);

    // If the user_forces array is empty, then the username doesn't exist
    if (user_forces.length === 0) {
        let response: RequestError = {
            message: "NIF ou password errados."
        }
        res.status(401).json(response);
        return;
    }

    let correct_password: boolean; // This variable will either hold the hashed password gotten from the request body or, incase of a default password, the cleartext password gotten from body

    // If the password is NULL, then the given password shouldn't be hashed
    if (user_forces[0].password === null) {
        correct_password = String(req.body.password) === "seguranca";
    } else {
        // If the password is not NULL, this needs to be hashed
        correct_password = await compare(req.body.password, String(user_forces[0].password));
    }

    // Now compare the passwords
    // If the password isn't correct, return 401
    if (!correct_password) {
        let response: RequestError = {
            message: "NIF ou password errados."
        }
        res.status(401).json(response);
        return;
    }

    // If everything is correct, generate a token
    const token = await generateToken();

    // After generating the token, store it in the databases of the forces the user belongs to
    for (const force of user_forces) {
        try {
            await queryDB(force.force, 'INSERT INTO tokens (token, nif) VALUES (?, ?)', [token, req.body.nif]);
        } catch (e) { // This error would only be if trying to store a token for an user that doesn't exist
            let response: RequestError = {
                message: "Erro ao tentar guardar o token de acesso"
            }

            res.status(500).json(response);
            return;
        }

    }

    // Send the token to the user
    let response: LoginResponse = {
        message: "Operação bem sucedida",
        data: {
            token: token
        }
    }
    res.status(200).json(response);
});

// Endpoint to change the password
app.post("/changepassword", async (req, res) => {
    // TODO: Implement this endpoint to change user's password
});

// Endpoint to get a user's account information
app.get("/:nif/info", async (req, res) => {
    // Check if the requesting user is the user itself
    const requestingUser = Number(req.header("x-portalseguranca-user"));
    if (requestingUser !== Number(req.params.nif)) {
        // If it's not the user itself, check if the user has the "accounts" intent
        let hasIntent = await userHasIntents(requestingUser, req.header("x-portalseguranca-force"), "accounts");
        if (!hasIntent) {
            let response: RequestError = {
                message: "Não tens permissão para efetuar esta ação"
            };
            res.status(403).json(response);
            return;
        }
    }

    // Since the user has permission, get the requested permissions from database.
    let response: AccountInfoResponse = {
        message: "Operação bem sucedida",
        data: {
            passwordChanged: false,
            lastUsed: new Date(),
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
    
    response.data.passwordChanged = passwordQuery[0].password !== null;

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

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;