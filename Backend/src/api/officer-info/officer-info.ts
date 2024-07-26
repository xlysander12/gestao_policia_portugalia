import express from 'express';

// Import utils
import {queryDB} from "../../utils/db-connector";
import {
    MinifiedOfficerData,
    OfficerListResponse,
    OfficerInfoGetResponse,
    OfficerUnit
} from "@portalseguranca/api-types/api/officer-info/schema";

export const officerInfoRoutes = express.Router();


officerInfoRoutes.get("/", async (req, res) => {
    // If there's no search defined, replace with empty string
    if (req.query.search === undefined) {
        req.query.search = "";
    }

    // Get the data from the database
    const officersListResult = await queryDB(req.header("x-portalseguranca-force"), `SELECT name, patent, callsign, status, nif FROM officersV WHERE CONCAT(name, patent, callsign, nif, phone, discord) LIKE ?`, `%${<string>req.query.search}%`);

    // Get the data from all the officer's and store in array
    let officersList: MinifiedOfficerData[] = [];
    for (const officer of officersListResult) {
        // Build officer data
        const officerData: MinifiedOfficerData = {
            name: officer.name,
            patent: officer.patent,
            callsign: officer.callsign,
            status: officer.status,
            nif: officer.nif
        }

        officersList.push(officerData);
    }


    let response: OfficerListResponse = {
        message: "Operação bem sucedida",
        data: officersList
    }

    res.status(200).json(response);
});

officerInfoRoutes.get("/:nif", async (req, res) => {
    let officerResult = await queryDB(req.header("x-portalseguranca-force"), `SELECT * FROM ${req.query.hasOwnProperty("raw") ? "officers" : "officersV"} WHERE nif = ?`, req.params.nif);

    if (officerResult.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    const info = officerResult[0];

    // Alter the dates to be a proper string (There's a lot of unknown shit going on here.
    // For more information on wtf is going on, check https://stackoverflow.com/a/29774197)
    info.entry_date = String(new Date(info.entry_date.getTime() - (info.entry_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]);
    info.promotion_date = info.promotion_date !== null ? String(new Date(info.promotion_date.getTime() - (info.promotion_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]): null;

    info.special_units = [];

    let officer_special_units_result = await queryDB(req.headers["x-portalseguranca-force"], 'SELECT unit, role FROM specialunits_officers WHERE nif = ? ORDER BY role DESC, unit DESC', req.params.nif);
    officer_special_units_result.forEach((row) => {
        // Create object to store the unit
        const unit: OfficerUnit = {
            id: row.unit,
            role: row.role
        }

        // Push the unit into the array
        info.special_units.push(unit);
    });

    // After getting all the data, build the response
    let response: OfficerInfoGetResponse = {
        message: "Operação bem sucedida",
        data: {
            name: info.name,
            nif: info.nif,
            phone: info.phone,
            iban: info.iban,
            kms: info.kms,
            discord: info.discord,
            steam: info.steam,
            patent: info.patent,
            callsign: info.callsign,
            status: info.status,
            entry_date: info.entry_date,
            promotion_date: info.promotion_date,
            special_units: info.special_units
        }
    }

    // Return the 200 code
    res.status(200).json(response);
});

officerInfoRoutes.patch("/:nif", async (req, res) => {
    // Check if the requested officer exists
    let requested_officer_data_result = await queryDB(req.headers["x-portalseguranca-force"], 'SELECT patent, status FROM officers WHERE nif = ?', req.params.nif);
    if (requested_officer_data_result.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    let requested_officer_data = requested_officer_data_result[0];

    // After making sure the officer exists, figure out if this change is considered a promotion
    // TODO: This needs to be properly address when additional forces are added. Statuses may vary between them.
    let isPromotion = requested_officer_data.patent !== req.body.patent // If patent has changed
        || (requested_officer_data.status === 1 && req.body.status === 3)  // If status has changed from "Formação" to "Ativo"
        || (requested_officer_data.status === 2 && req.body.status === 3); // If status has changed from "Provisório" to "Ativo"


    let requesting_officer_data_result = await queryDB(req.headers["x-portalseguranca-force"], 'SELECT patent FROM officers WHERE nif = ?', req.header("x-portalseguranca-user"));
    const requestingOfficerPatente = requesting_officer_data_result[0].patent;

    if (requested_officer_data.patent >= requestingOfficerPatente) {
        res.status(403).json({
            message: "Não tens permissão para editar este efetivo."
        });
        return;
    }

    // If everything checks out, update the officer's basic info
    // TODO: It shouldn't be needed to send all information just to alter one or other field. This should be fixed.
    let updateQuery = `UPDATE officers SET name = ?, patent = ?, 
                              callsign = ?, 
                              status = ?, 
                              entry_date = ?, 
                              phone = ?, 
                              iban = ?, 
                              kms = ?, 
                              discord = ?, 
                              steam = ? 
                              WHERE nif = ?`;
    await queryDB(req.headers["x-portalseguranca-force"], updateQuery, [req.body.name, req.body.patent, req.body.callsign, req.body.status, req.body.entry_date, req.body.phone, req.body.iban, req.body.kms, req.body.discord, req.body.steam, req.params.nif]);

    // If the change is considered a promotion, update the promotion date
    if (isPromotion) {
        await queryDB(req.headers["x-portalseguranca-force"], `UPDATE officers SET promotion_date = CURRENT_TIMESTAMP WHERE nif = ?`, req.params.nif);
    }

    // Now, update the special units the officer belongs to
    if (req.body.special_units !== undefined) {
        await queryDB(req.headers["x-portalseguranca-force"], 'DELETE FROM specialunits_officers WHERE nif = ?', req.params.nif);
        for (const unit of req.body.special_units) {
            await queryDB(req.headers["x-portalseguranca-force"], 'INSERT INTO specialunits_officers (nif, unit, role) VALUES (?, ?, ?)', [req.params.nif, unit.id, unit.role]);
        }
    }

    // After all is complete, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });
});

officerInfoRoutes.put("/:nif", async (req, res) => {
    // Making sure the user has provided all necessary information
    if (req.body.name === undefined ||
        req.body.phone === undefined ||
        req.body.iban === undefined ||
        req.body.kms === undefined ||
        req.body.discord === undefined ||
        req.body.steam === undefined) {
        res.status(400).json({
            message: "Não foram fornecidos todos os dados necessários. É necessário fornecer nome, telemovel, iban, kms, discord e steam."
        });
        return;
    }

    // Making sure the provided nif doesn't already exist
    let officer_exists_check_result = await queryDB(req.headers["x-portalseguranca-force"], 'SELECT * FROM officers WHERE nif = ?', req.params.nif);
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
        let callsigns_result = await queryDB(req.headers["x-portalseguranca-force"], 'SELECT callsign FROM officers WHERE callsign REGEXP "^A-[0-9]{1,2}$" ORDER BY callsign DESC');
        let callsign_number = (Number.parseInt(callsigns_result[0].callsign.split("-")[1]) + 1);
        callsign = `A-${callsign_number.toString().padStart(2, "0")}`;
    }

    // Adding the officer to the database
    await queryDB(req.headers["x-portalseguranca-force"], 'INSERT INTO officers (name, patent, callsign, phone, nif, iban, kms, discord, steam) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.name, patent, callsign, req.body.phone, req.params.nif, req.body.iban, req.body.kms, req.body.discord, req.body.steam]);

    // If everything went according to plan, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });

});

officerInfoRoutes.delete("/:nif", async (req, res) => {
    // Making sure the officer exists
    let officer_exists_check_result = await queryDB(req.headers["x-portalseguranca-force"], `SELECT patent FROM officers WHERE nif = ?`, req.params.nif);

    if (officer_exists_check_result.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    // Making sure the requesting user is higher patent the requested officer
    // Fetching the requesting user's patent
    let requestingOfficerpatent = (await queryDB(req.headers["x-portalseguranca-force"], 'SELECT patent FROM officers WHERE nif = ?', req.header("x-portalseguranca-user")))[0].patent;

    // Getting the requested officer's patent
    let requestedOfficerPatente = officer_exists_check_result[0].patent;

    if (requestedOfficerPatente >= requestingOfficerpatent) {
        res.status(403).json({
            message: "Não tens permissão para despedir este efetivo."
        });
        return;
    }

    // After making sure the officer can be fired, run the SQL procedure to transfer the data to the archive db
    await queryDB(req.headers["x-portalseguranca-force"], 'CALL TransferOfficerToArchive(?, ?)', [req.params.nif, req.body.reason]);

    // After transferring the officer to the archive, delete the officer from the main database
    await queryDB(req.headers["x-portalseguranca-force"], 'DELETE FROM officers WHERE nif = ?', req.params.nif);

    // If everything went according to plan, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });
});

console.log("[Portal Segurança] OfficerInfo routes loaded successfully.")