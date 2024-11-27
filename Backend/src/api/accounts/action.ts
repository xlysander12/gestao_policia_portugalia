import express, {CookieOptions} from "express";
import {compare, hash} from "bcrypt";
import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER, PASSWORD_SALT_ROUNDS} from "../../utils/constants";
import {generateToken} from "../../utils/user-handler";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";
import {LoginResponse} from "@portalseguranca/api-types/account/output";
import {ChangePasswordRequestBodyType, LoginRequestBodyType} from "@portalseguranca/api-types/account/input";
import {APIResponse} from "../../types";
import {getUserForces} from "./repository";

const app = express.Router();

// Endpoint to change the password
app.post("/change-password", async (req, res: APIResponse) => {
    const {oldPassword, newPassword, confirmPassword} = req.body as ChangePasswordRequestBodyType;

    // * Check if the old password is correct
    // Get the password from the DB
    const passwordQuery = await queryDB(req.header(FORCE_HEADER), 'SELECT password FROM users WHERE nif = ?', res.locals.user);

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
    const user_forces = await getUserForces(res.locals.user!);
    for (const forceData of user_forces) {
        await queryDB(forceData.name, 'UPDATE users SET password = ? WHERE nif = ?', [hashedPassword, res.locals.user]);
    }

    // Remove all tokens from the user, except the one used to change the password
    await queryDB(req.header(FORCE_HEADER), 'DELETE FROM tokens WHERE nif = ? AND token != ?', [res.locals.user, req.header("authorization") || req.cookies.sessionToken]);

    // Return success
    let response: RequestSuccess = {
        message: "Password alterada com sucesso"
    }
    res.status(200).json(response);
});

export default app;