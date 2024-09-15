import express from "express";

import infoRoutes from "./info";
import manageRoutes from "./manage";
import actionRoutes from "./action";
import {userHasIntents} from "../../utils/user-handler";
import { RequestError } from "@portalseguranca/api-types/api/schema";
import { ValidateTokenResponse } from "@portalseguranca/api-types/api/account/schema";

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

// Import info routes
app.use(infoRoutes);

// Import manage routes
app.use(manageRoutes);

// Import action routes
app.use(actionRoutes);

console.log("[Portal Segurança] Account routes loaded successfully!");

export default app;