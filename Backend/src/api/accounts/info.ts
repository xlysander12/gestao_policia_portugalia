// Import packages
import express from 'express';

// Import utils
import {getUserForces, userHasIntents} from "../../utils/user-handler";
import {queryDB} from "../../utils/db-connector";

// Import types
import {
    AccountInfoResponse,
    UserForcesResponse
} from "@portalseguranca/api-types/account/output";
import {RequestError} from "@portalseguranca/api-types";

const app = express.Router();

// Endpoint to get a user's accounts information
app.get("/:nif", async (req, res) => {
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
            lastUsed: "",
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

export default app;