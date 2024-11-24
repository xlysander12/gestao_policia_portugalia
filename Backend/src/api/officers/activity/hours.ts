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

    const filtersResult = buildFiltersQuery(res.locals.routeDetails!, filters, {subquery: "officer = ?", value: res.locals.requestedOfficerData.nif});

    // Get the hours of the Officer
    const hours = await queryDB(req.header(FORCE_HEADER), `SELECT * FROM officer_hours ${filtersResult.query}`, filtersResult.values);

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