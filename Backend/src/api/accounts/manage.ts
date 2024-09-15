import express from "express";
import {userHasIntents} from "../../utils/user-handler";
import {queryDB} from "../../utils/db-connector";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/api/schema";

const app = express.Router();

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