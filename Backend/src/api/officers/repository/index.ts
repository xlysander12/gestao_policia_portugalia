import {routeMethodType} from "../../routes";
import buildFiltersQuery from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {
    MinifiedOfficerData,
    OfficerUnit
} from "@portalseguranca/api-types/officers/output";
import {InnerOfficerData} from "../../../types";

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

export async function getOfficerUnits(force: string, nif: number): Promise<OfficerUnit[]> {
    // * Get the data from the database
    const officerUnitsResult = await queryDB(force, `SELECT unit, role
                                                     FROM specialunits_officers
                                                     WHERE officer = ?`, nif);

    // Get the data from all the officer's units and store in array
    let officerUnits: OfficerUnit[] = [];
    for (const unit of officerUnitsResult) {
        // Build officer unit
        const officerUnit = {
            id: unit.unit,
            role: unit.role
        }

        officerUnits.push(officerUnit);
    }

    return officerUnits;
}

export async function getOfficerData(force: string, nif: number, pretty: boolean = false): Promise<InnerOfficerData | null> {
    // * Get the data from the database
    let officerDataResult;
    if (pretty) {
        officerDataResult = await queryDB(force, `SELECT *
                                                  FROM officersV
                                                  WHERE nif = ? LIMIT 1`, nif);
    }
    else {
        officerDataResult = await queryDB(force, `SELECT *
                                                  FROM officers
                                                  WHERE nif = ? LIMIT 1`, nif);
    }

    // Check if the officer exists
    if (officerDataResult.length === 0) {
        return null;
    }

    // Get the officer data
    return {
        name: officerDataResult[0].name,
        patent: officerDataResult[0].patent,
        callsign: officerDataResult[0].callsign,
        status: officerDataResult[0].status,
        entry_date: officerDataResult[0].entry_date,
        promotion_date: officerDataResult[0].promotion_date,
        phone: officerDataResult[0].phone,
        nif: officerDataResult[0].nif,
        iban: officerDataResult[0].iban,
        kms: officerDataResult[0].kms,
        discord: officerDataResult[0].discord,
        steam: officerDataResult[0].steam,
        special_units: await getOfficerUnits(force, nif)
    };
}