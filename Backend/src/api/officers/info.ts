import express from "express";

import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER} from "../../utils/constants";
import {
    MinifiedOfficerData,
    OfficerInfoGetResponse,
    OfficerListResponse,
    OfficerUnit
} from "@portalseguranca/api-types/officers/output";
import {officerExistsMiddle} from "./officer-exists-middle";
import buildFiltersQuery from "../../utils/filters";


const app = express.Router();


app.get("/", async (req, res) => {
    // * Get the filters
    // Build an array with all present filters in the query params of the request
    let filters: {name: string, value: any}[] = [];
    for (const key in req.query) {
        filters.push({name: key, value: req.query[key]});
    }

    const filtersResult = buildFiltersQuery(res.locals.routeDetails, filters);

    // * Get the data from the database
    const officersListResult = await queryDB(req.header(FORCE_HEADER), `SELECT name, patent, callsign, status, nif FROM officersV ${filtersResult.query}`, filtersResult.values);

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


app.get("/:nif", officerExistsMiddle, async (req, res) => {
    const info = res.locals.requestedOfficerData;

    // Alter the dates to be a proper string (There's a lot of unknown shit going on here.
    // For more information on wtf is going on, check https://stackoverflow.com/a/29774197)
    info.entry_date = String(new Date(info.entry_date.getTime() - (info.entry_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]);
    info.promotion_date = info.promotion_date !== null ? String(new Date(info.promotion_date.getTime() - (info.promotion_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]): null;

    info.special_units = [];

    let officer_special_units_result = await queryDB(req.header(FORCE_HEADER), 'SELECT unit, role FROM specialunits_officers WHERE officer = ? ORDER BY role DESC, unit DESC', req.params.nif);
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


export default app;