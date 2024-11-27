// Import packages
import express from 'express';

// Import utils
import {getUserForces} from "../../utils/user-handler";

// Import types
import {
    UserForcesResponse
} from "@portalseguranca/api-types/account/output";
import {RequestError} from "@portalseguranca/api-types";
import {APIResponse} from "../../types";

const app = express.Router();



// Endpoint to fetch all forces an user has access to
app.get("/:nif/forces", async (req, res: APIResponse) => {
    // Check if the requesting user is the user itself
    // TODO: This needs some kind of permission system. For now, keep it as is
    if (Number(res.locals.user) !== Number(req.params.nif)) {
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
            forces: forces.map((force) => {
                return {
                    name: force.name,
                    suspended: force.suspended
                }
            })
        }
    };

    // Return the response
    res.status(200).json(response);
});

export default app;