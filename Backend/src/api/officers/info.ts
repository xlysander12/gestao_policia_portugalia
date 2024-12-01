import express from "express";

import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER} from "../../utils/constants";
import {
    MinifiedOfficerData,
    OfficerInfoGetResponse,
    OfficerListResponse,
    OfficerUnit
} from "@portalseguranca/api-types/officers/output";
import officerExistsMiddle from "../../middlewares/officer-exists";
import buildFiltersQuery from "../../utils/filters";
import {OfficerInfoAPIResponse} from "../../types";


const app = express.Router();

app.get("/:nif", officerExistsMiddle, async (req, res: OfficerInfoAPIResponse) => {
    const info = res.locals.requestedOfficerData;


    // Get the special units of the Officer
    info.special_units = [];

    let officer_special_units_result = await queryDB(req.header(FORCE_HEADER)!, 'SELECT unit, role FROM specialunits_officers WHERE officer = ? ORDER BY role DESC, unit DESC', req.params.nif);
    officer_special_units_result.forEach((row) => {
        // Create object to store the unit
        const unit: OfficerUnit = {
            id: row.unit,
            role: row.role
        }

        // Push the unit into the array
        info.special_units!.push(unit);
    });

    // After getting all the data, build the response
    let response: OfficerInfoGetResponse = {
        message: "Operação bem sucedida",
        data: info
    }

    // Return the 200 code
    res.status(200).json(response);
});


export default app;