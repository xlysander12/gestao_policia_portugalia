import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER} from "../../utils/constants";
import express from 'express';
import officerExistsMiddle from "../../middlewares/officer-exists";
import { DeleteOfficerRequestBody } from "@portalseguranca/api-types/officers/input";
import {OfficerInfoAPIResponse} from "../../types";

const app = express.Router();


app.delete("/:nif", officerExistsMiddle, async (req, res: OfficerInfoAPIResponse) => {
    const {reason} = req.body as DeleteOfficerRequestBody;

    // Making sure the requesting user is higher patent the requested officer
    // Fetching the requesting user's patent
    let requestingOfficerpatent = (await queryDB(req.header(FORCE_HEADER)!, 'SELECT patent FROM officers WHERE nif = ?', res.locals.loggedOfficer))[0].patent;

    // Getting the requested officer's patent
    let requestedOfficerPatente = res.locals.targetOfficer.patent;

    if (requestedOfficerPatente >= requestingOfficerpatent) {
        res.status(403).json({
            message: "Não tens permissão para despedir este efetivo."
        });
        return;
    }

    // After making sure the officer can be fired, run the SQL procedure to transfer the data to the archive db
    await queryDB(req.header(FORCE_HEADER)!, 'CALL TransferOfficerToArchive(?, ?)', [req.params.nif, reason]);

    // After transferring the officer to the archive, delete the officer from the main database
    await queryDB(req.header(FORCE_HEADER)!, 'DELETE FROM officers WHERE nif = ?', req.params.nif);

    // If everything went according to plan, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });
});


export default app;