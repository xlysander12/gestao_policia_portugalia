import express from "express";
import {OfficerInfoAPIResponse} from "../../../../types";
import {queryDB} from "../../../../utils/db-connector";
import buildFiltersQuery from "../../../../utils/filters";
import {FORCE_HEADER} from "../../../../utils/constants";
import {
    OfficerHoursResponse,
    OfficerSpecificHoursResponse
} from "@portalseguranca/api-types/officers/activity/output";

const app = express.Router();

app.get("/", async (req, res: OfficerInfoAPIResponse) => {
    // Get the filters values
    let filters = [];
    for (const query in req.query) {
        filters.push({name: query, value: req.query[query]});
    }

    const filtersResult = buildFiltersQuery(res.locals.routeDetails!, filters, {subquery: "officer = ?", value: res.locals.requestedOfficerData.nif});

    // Get the hours of the Officer
    const hours = await queryDB(req.header(FORCE_HEADER)!, `SELECT * FROM officer_hours ${filtersResult.query}`, filtersResult.values);

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

app.get("/:id", async (req, res: OfficerInfoAPIResponse) => {
    const {id} = req.params;

    // Get the information about this specific hours entry
    const hours = await queryDB(req.header(FORCE_HEADER)!, `SELECT * FROM officer_hours WHERE id = ? AND officer = ?`, [id, res.locals.requestedOfficerData.nif]);

    // If not results are found, either the entry doesn't exist, or it's not from the requested officer
    if (hours.length === 0) {
        res.status(404).json({message: "Não encontrado"});
        return;
    }

    // Build the response body
    let response: OfficerSpecificHoursResponse = {
        message: "Operação bem sucedida",
        data: {
            id: hours[0].id,
            week_start: hours[0].week_start.toISOString().split("T")[0],
            week_end: hours[0].week_end.toISOString().split("T")[0],
            minutes: hours[0].minutes,
            submitted_by: hours[0].submitted_by
        }
    }

    res.status(200).json(response);



});

export default app;