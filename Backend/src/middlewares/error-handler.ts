import express from "express";
import {APIResponse} from "../types";
import {queryDB} from "../utils/db-connector";
import {FORCE_HEADER} from "../utils/constants";
import {logToConsole} from "../utils/logger";

async function getErrorCode(force: string): Promise<string> {
    // Generate a random code composed of 6 characters
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    let unique = false;
    while (!unique) {
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Make sure the generated code is unique
        const dbResult = await queryDB(force, "SELECT * FROM errors WHERE code = ?", result);
        if (dbResult.length === 0) unique = true;
    }

    // Since the code is unique, return it
    return result;
}

async function errorHandlerMiddleware(err: Error, req: express.Request, res: APIResponse) {
    // This error was triggered by a constraint violation while inserting some data in the database
    // If this is the case, return 400 as it was user error
    if (err.message && err.message.includes("CONSTRAINT")) {
        return res.status(400).json({
            message: "Informações fornecidas inválidas",
        });
    }

    // Defining variable that holds the route
    const route = req.originalUrl.split("api/")[1];

    // * If the error was triggered by any other cause not listed above, store the stack trace and all relevant information in the database and return a unique code to the user
    // First, make sure the request had the force header
    const force = req.header(FORCE_HEADER);

    // If the force header is not present, return 500 without any code
    if (!force) {
        logToConsole(`${route} - ${err.stack}`, "error");
        return res.status(500).json({
            message: "Erro interno do servidor",
        });
    }

    // Get a unique code
    const code = await getErrorCode(force);

    // Store the error in the database
    await queryDB(force, "INSERT INTO errors (code, route, method, body, nif, stack) VALUES (?, ?, ?, ?, ?, ?)", [code, route, req.method, req.body ? JSON.stringify(req.body): null, res.locals.loggedOfficer ? res.locals.loggedOfficer.nif: null, err.stack]);

    logToConsole(`${route} - Error Code: ${code}`, "error", true);

    res.status(500).json({
        message: "Erro interno do servidor",
        code: code,
        details: process.env.PS_IS_PRODUCTION !== "true" ? err.stack: undefined
    });
}

export default errorHandlerMiddleware;