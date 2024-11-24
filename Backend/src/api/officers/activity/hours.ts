import express from "express";
import {OfficerInfoAPIResponse} from "../../../types";
import {queryDB} from "../../../utils/db-connector";
import buildFiltersQuery from "../../../utils/filters";
import {FORCE_HEADER} from "../../../utils/constants";
import {OfficerHoursResponse} from "@portalseguranca/api-types/officers/activity/output";

const app = express.Router();

app.get("/", async (req, res: OfficerInfoAPIResponse) => {
    // Get the filters values
    let filters = [];
    for (const query in req.query) {
        filters.push({name: query, value: req.query[query]});
    }

    const filtersResult = buildFiltersQuery(res.locals.routeDetails!, filters);

    // Get the hours of the Officer
    let hours;
    if (filtersResult.query === "") { // No filters where specified
        hours = await queryDB(req.header(FORCE_HEADER), `SELECT * FROM officer_hours WHERE officer = ?`, res.locals.requestedOfficerData.nif);
    } else {
        // TODO: Get this error out of here, somehow
        hours = await queryDB(req.header(FORCE_HEADER), `SELECT * FROM officer_hours ${filtersResult.query} AND officer = ?`, [...filtersResult.values, res.locals.requestedOfficerData.nif]);
    }

    let response: OfficerHoursResponse = {
        message: "Operação bem sucedida",
        data: hours.map((hour: any) => {
            return {
                id: hour.id,
                week_start: hour.week_start.toISOString().split("T")[0],
                week_end: hour.week_end.toISOString().split("T")[0],
                minutes: hour.minutes,
                submitted_by: hour.submitted_by
            }
        })
    }

    res.status(200).json(response);
});

export default app;