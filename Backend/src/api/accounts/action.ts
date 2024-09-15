import express, {CookieOptions} from "express";
import {compare, hash} from "bcrypt";
import {queryDB} from "../../utils/db-connector";
import {PASSWORD_SALT_ROUNDS} from "../../utils/constants";
import {generateToken, getUserForces} from "../../utils/user-handler";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/api/schema";
import {LoginResponse} from "@portalseguranca/api-types/api/account/schema";

const app = express.Router();

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
    const user_forces = await getUserForces(loggedUser);
    for (const forceData of user_forces) {
        await queryDB(forceData.force, 'UPDATE users SET password = ? WHERE nif = ?', [hashedPassword, loggedUser]);
    }

    // Return success
    let response: RequestSuccess = {
        message: "Password alterada com sucesso"
    }
    res.status(200).json(response);
});

export default app;