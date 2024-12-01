import {routeMethodType} from "../../routes";
import buildFiltersQuery from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";

export async function getOfficersList(force: string, routeDetails: routeMethodType, filters: {name: string, value: any}[]) {
    const filtersResult = buildFiltersQuery(routeDetails, filters);

    // * Get the data from the database
    const officersListResult = await queryDB(force, `SELECT name, patent, callsign, status, nif FROM officersV ${filtersResult.query}`, filtersResult.values);

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

    return officersList;
}