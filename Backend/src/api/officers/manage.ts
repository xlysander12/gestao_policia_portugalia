import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER} from "../../utils/constants";
import express from 'express';
import officerExistsMiddle from "../../middlewares/officer-exists";
import { DeleteOfficerRequestBody } from "@portalseguranca/api-types/officers/input";
import {APIResponse, OfficerInfoAPIResponse} from "../../types";

const app = express.Router();

app.put("/:nif", async (req, res: APIResponse) => {
    // Making sure the provided nif doesn't already exist
    let officer_exists_check_result = await queryDB(req.header(FORCE_HEADER)!, 'SELECT * FROM officers WHERE nif = ?', req.params.nif);
    if (officer_exists_check_result.length !== 0) {
        res.status(409).json({
            message: "Já existe um outro efetivo com esse NIF."
        });
        return;
    }

    // Checking if the patent will be a recruit or not
    let patent = req.query.hasOwnProperty("recruit") ? -1: 0;

    // Calculating what the new callsign will be, if it's not a recruit
    let callsign = null
    if (patent === 0) {
        let callsigns_result = await queryDB(req.header(FORCE_HEADER)!, 'SELECT callsign FROM officers WHERE patent <= 3 ORDER BY callsign DESC');
        let callsign_number = (Number.parseInt(callsigns_result[0].callsign.split("-")[1]) + 1);
        callsign = `A-${callsign_number.toString().padStart(2, "0")}`;
    }

    // Adding the officer to the database
    await queryDB(req.header(FORCE_HEADER)!, 'INSERT INTO officers (name, patent, callsign, phone, nif, iban, kms, discord, steam) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.name, patent, callsign, req.body.phone, req.params.nif, req.body.iban, req.body.kms, req.body.discord, req.body.steam]);

    // If everything went according to plan, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });

});

app.patch("/:nif", officerExistsMiddle, async (req, res: OfficerInfoAPIResponse) => {
    const validFields = ["name", "patent", "callsign", "status", "entry_date", "phone", "iban", "kms", "discord", "steam"];

    let requested_officer_data = res.locals.targetOfficer;

    // Figure out if this change is considered a promotion
    // TODO: This needs to be properly address when additional forces are added. Statuses may vary between them.
    let isPromotion = requested_officer_data.patent !== req.body.patent // If patent has changed
        || (requested_officer_data.status === 1 && req.body.status === 3)  // If status has changed from "Formação" to "Ativo"
        || (requested_officer_data.status === 2 && req.body.status === 3); // If status has changed from "Provisório" to "Ativo"


    let requesting_officer_data_result = await queryDB(req.header(FORCE_HEADER)!, 'SELECT patent FROM officers WHERE nif = ?', res.locals.loggedOfficer);
    const requestingOfficerPatente = requesting_officer_data_result[0].patent;

    if (requested_officer_data.patent >= requestingOfficerPatente) {
        res.status(403).json({
            message: "Não tens permissão para editar este efetivo."
        });
        return;
    }

    // Build the query string and params depending on the fields that were provided
    let params: string[] = [];
    let updateQuery = `UPDATE officers SET ${validFields.reduce((acc, field) => {
        if (req.body[field] !== undefined) {
            acc += `${field} = ?, `;
            params.push(req.body[field]);
        }

        return acc;
    }, "").slice(0, -2)} WHERE nif = ?`;

    await queryDB(req.header(FORCE_HEADER)!, updateQuery, [...params, req.params.nif]);

    // If the change is considered a promotion, update the promotion date
    if (isPromotion) {
        await queryDB(req.header(FORCE_HEADER)!, `UPDATE officers SET promotion_date = CURRENT_TIMESTAMP WHERE nif = ?`, req.params.nif);
    }

    // Now, update the special units the officer belongs to
    if (req.body.special_units !== undefined) {
        await queryDB(req.header(FORCE_HEADER)!, 'DELETE FROM specialunits_officers WHERE officer = ?', req.params.nif);
        for (const unit of req.body.special_units) {
            await queryDB(req.header(FORCE_HEADER)!, 'INSERT INTO specialunits_officers (officer, unit, role) VALUES (?, ?, ?)', [req.params.nif, unit.id, unit.role]);
        }
    }

    // After all is complete, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });
});

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