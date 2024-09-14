// Import packages
import express, {CookieOptions} from 'express';
import {compare, hash} from 'bcrypt';

// Import utils
import {generateToken, getUserForces, userHasIntents} from "../../utils/user-handler";
import {queryDB} from "../../utils/db-connector";

// Import constants
import {PASSWORD_SALT_ROUNDS} from "../../utils/constants";

// Import types
import {
    AccountInfoResponse,
    LoginResponse,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/api/account/schema";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/api/schema";

const app = express.Router();

// Endpoint to validate a Token and check if the user has the correct permissions
app.post("/validateToken", async (req, res) => {
    // Check if intents were provided
    if (req.body.intents) { // If intents were provided, check if the user has them
        let hasIntents = await userHasIntents(Number(res.locals.user), req.header("x-portalseguranca-force"), req.body.intents);
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
        data: Number(res.locals.user)
    };
    return res.status(200).json(response);

});

// Endpoint to login an user
app.post("/login", async (req, res) => {
    const {nif, password, persistent} = req.body;
    if (!nif || !password) {
        let response: RequestError = {
            message: "NIF ou password não fornecidos"
        }
        res.status(400).json(response);
    }

    // Check if the user exists (it's needed to check on all forces databases)
    let user_forces = await getUserForces(nif, true);

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
        correct_password = String(password) === "seguranca";
    } else {
        // If the password is not NULL, this needs to be hashed
        correct_password = await compare(password, String(user_forces[0].password));
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
            await queryDB(force.force, 'INSERT INTO tokens (token, nif) VALUES (?, ?)', [token, nif]);
        } catch (e) { // This error would only be if trying to store a token for an user that doesn't exist
            let response: RequestError = {
                message: "Erro ao tentar guardar o token de acesso"
            }

            res.status(500).json(response);
            return;
        }

    }

    // Set the token to the response's cookies
    let cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: process.env.IS_PRODUCTION === "true"
    }
    // If the login is marked as "persistent", set the cookie to last 400 days (max allowed age by Chrome)
    if (persistent) {
        cookieOptions.maxAge = 1000 * 60 * 60 * 24 * 400; // 400 days
    }
    res.cookie("sessionToken", token, cookieOptions);

    // Send the token to the user
    let response: LoginResponse = {
        message: "Operação bem sucedida",
        data: {
            token: token,
            forces: user_forces.map((force) => force.force)
        }
    }
    res.status(200).json(response);
});

// Endpoint to change the password
// TODO: This action, when successful, should also clear all tokens linked to the account.
app.post("/changepassword", async (req, res) => {
    // Store the logged user
    const loggedUser = Number(res.locals.user);
    const {oldPassword, newPassword, confirmPassword} = req.body;

    // * Check if the old password is correct
    // Get the password from the DB
    const passwordQuery = await queryDB(req.header("x-portalseguranca-force"), 'SELECT password FROM users WHERE nif = ?', loggedUser);

    // If the password isn't the default one, hash the password and compare it
    let isPasswordCorrect: boolean;
    if (passwordQuery[0].password === null) { // Password is the default one
        isPasswordCorrect = "seguranca" == String(oldPassword);
    } else {
        isPasswordCorrect = await compare(String(oldPassword), String(passwordQuery[0].password));
    }

    // If the password is incorrect, return 401
    if (!isPasswordCorrect) {
        let response: RequestError = {
            message: "Password incorreta"
        }
        res.status(401).json(response);
        return;
    }

    // Make sure the new passwords match
    if (newPassword !== confirmPassword) {
        let response: RequestError = {
            message: "As novas passwords não coincidem"
        }
        res.status(400).json(response);
        return;
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, PASSWORD_SALT_ROUNDS);

    // * Update the password in every force the user is in
    // Get the forces the user is in
    const user_forces = await getUserForces(loggedUser, true);
    for (const forceData of user_forces) {
        await queryDB(forceData.force, 'UPDATE users SET password = ? WHERE nif = ?', [hashedPassword, loggedUser]);
    }

    // Return success
    let response: RequestSuccess = {
        message: "Password alterada com sucesso"
    }
    res.status(200).json(response);
});

// Endpoint to reset the password
app.post("/:nif/resetpassword", async (req, res) => {
    // TODO: Implement this endpoint to reset user's password
});

// Endpoint to get a user's accounts information
app.get("/:nif/info", async (req, res) => {
    // Check if the requesting user is the user itself
    const requestingUser = Number(res.locals.user);
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

    // Fetch the password and the last time the user interacted with the system
    const infoQuery = await queryDB(req.header("x-portalseguranca-force"), 'SELECT password, last_interaction FROM users WHERE nif = ?', req.params.nif);

    // If no user exists, return 404
    if (infoQuery.length === 0) {
        const response: RequestError = {
            message: "O utilizador requisitado não existe"
        }
        return res.status(404).json(response);
    }

    // Check if the password has been changed by the user
    response.data.passwordChanged = infoQuery[0].password !== null;

    // Get the last time the user interacted with the system
    response.data.lastUsed = infoQuery[0].last_interaction;

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

app.patch("/:nif/intents", async (req, res) => {
    const intents  = Object.keys(req.body);

    // Update intents in the database
    for (let i = 0; i < intents.length; i++) {
        // Make sure the requesting user has the intent it wants to update
        if(!(await userHasIntents(res.locals.user, req.header("x-portalseguranca-force"), intents[i]))) {
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

// Endpoint to fetch all forces an user has access to
app.get("/:nif/forces", async (req, res) => {
    // Check if the requesting user is the user itself
    const requestingUser = Number(res.locals.user);
    // TODO: This needs some kind of permission system. For now, keep it as is
    if (requestingUser !== Number(req.params.nif)) {
        let response: RequestError = {
            message: "Não tens permissão para efetuar esta ação"
        };
        res.status(403).json(response);
        return;
    }

    // Get the all forces the user has acces to.
    const forces = await getUserForces(Number(req.params.nif), false);
    let response: UserForcesResponse = {
        message: "Operação bem sucedida",
        data: {
            forces: forces.map((force) => force.force)
        }
    };

    // Return the response
    res.status(200).json(response);
});

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;