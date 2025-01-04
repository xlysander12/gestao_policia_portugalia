import {RouteFilterType} from "../../routes";
import buildFiltersQuery from "../../../utils/filters";
import {queryDB} from "../../../utils/db-connector";
import {
    MinifiedOfficerData,
    OfficerUnit
} from "@portalseguranca/api-types/officers/output";
import {InnerOfficerData} from "../../../types";
import {UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {getOfficerActiveJustifications} from "../activity/justifications/repository";
import {getForceInactiveStatus, getForceInactivityJustificationType} from "../../../utils/config-handler";

export async function getOfficersList(force: string, routeValidFilters: RouteFilterType, filters: {name: string, value: any}[]) {
    const filtersResult = buildFiltersQuery(routeValidFilters, filters);

    // * Get the data from the database
    const officersListResult = await queryDB(force, `SELECT name, patent, callsign, status, nif FROM officersV ${filtersResult.query}`, filtersResult.values);

    // Get the data from all the officer's and store in array
    let officersList: MinifiedOfficerData[] = [];
    for (const officer of officersListResult) {
        // * Check if the officer has any active "inactivity type" justifications
        // Get the officer's active justifications
        const justifications = await getOfficerActiveJustifications(force, officer.nif);

        // Check if any of the justifications are of the "inactivity type"
        const hasInactivityJustification: boolean = (justifications.find(justification => justification.type === getForceInactivityJustificationType(force))) !== undefined;

        // Build officer data
        const officerData: MinifiedOfficerData = {
            name: officer.name,
            patent: officer.patent,
            callsign: officer.callsign,
            status: hasInactivityJustification ? getForceInactiveStatus(force): officer.status,
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

export async function getOfficerData(nif: number, force: string, pretty: boolean = false, former: boolean = false): Promise<InnerOfficerData | null> {
    // * Get the data from the database
    let officerDataResult;
    if (pretty) {
        officerDataResult = await queryDB(force, `SELECT *
                                                  FROM officersV
                                                  WHERE nif = ? AND fired = ? LIMIT 1`, [nif, former ? 1: 0]);
    }
    else {
        officerDataResult = await queryDB(force, `SELECT *
                                                  FROM officers
                                                  WHERE nif = ? AND fired = ? LIMIT 1`, [nif, former ? 1: 0]);
    }

    // Check if the officer exists
    if (officerDataResult.length === 0) {
        return null;
    }

    // * Check if the officer has any active "inactivity type" justifications
    // Get the officer's active justifications
    const justifications = await getOfficerActiveJustifications(force, nif);

    // Check if any of the justifications are of the "inactivity type"
    const hasInactivityJustification: boolean = (justifications.find(justification => justification.type === getForceInactivityJustificationType(force))) !== undefined;


    // Get the officer data
    return {
        name: officerDataResult[0].name,
        patent: officerDataResult[0].patent,
        callsign: officerDataResult[0].callsign,
        status: hasInactivityJustification ? getForceInactiveStatus(force): officerDataResult[0].status,
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

export async function getNextAvaliableCallsign(startingLetter: string, force: string) {
    // * Get the data from the database
    const callsignsResult = await queryDB(force, `SELECT callsign
                                                 FROM officers
                                                 WHERE callsign LIKE ? ORDER BY callsign DESC`, `${startingLetter}%`);

    // Get the next callsign number
    let callsignNumber = 1;
    if (callsignsResult.length > 0) {
        callsignNumber = (Number.parseInt(callsignsResult[0].callsign.split("-")[1]) + 1);
    }

    return `${startingLetter}-${callsignNumber.toString().padStart(2, "0")}`;
}

export async function addOfficer(name: string, patent: number, callsign: string | null, phone: number, nif: number, iban: string, kms: number, discord: number, steam: string,
                                 force: string) {
    // * Add the officer to the database
    await queryDB(force, 'INSERT INTO officers (name, patent, callsign, phone, nif, iban, kms, discord, steam) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, patent, callsign, phone, nif, iban, kms, discord, steam]);
}

export async function updateOfficer(nif: number, force: string, changes: UpdateOfficerRequestBody, isPromotion: boolean) {
    const validFields = ["name", "patent", "callsign", "status", "entry_date", "phone", "iban", "kms", "discord", "steam"];

    // Build the query string and params depending on the fields that were provided
    let params: string[] = [];
    let updateQuery = `UPDATE officers SET ${validFields.reduce((acc, field) => {
        // @ts-ignore
        if (changes[field] !== undefined) {
            acc += `${field} = ?, `;
            // @ts-ignore
            params.push(changes[field]);
        }

        return acc;
    }, "").slice(0, -2)} WHERE nif = ?`;

    await queryDB(force, updateQuery, [...params, nif]);

    // If the change is considered a promotion, update the promotion date
    if (isPromotion) {
        await queryDB(force, `UPDATE officers SET promotion_date = CURRENT_TIMESTAMP WHERE nif = ?`, nif);
    }

    // If there are any new special units, update them
    if (changes.special_units !== undefined) {
        await updateOfficerUnits(nif, force, changes.special_units);
    }
}

export async function updateOfficerUnits(nif: number, force: string, units: OfficerUnit[]) {
    // * Delete the officer's current units
    await queryDB(force, 'DELETE FROM specialunits_officers WHERE officer = ?', nif);

    // * Add the new units
    for (const unit of units) {
        await queryDB(force, 'INSERT INTO specialunits_officers (officer, unit, role) VALUES (?, ?, ?)', [nif, unit.id, unit.role]);
    }
}

export async function fireOfficer(nif: number, force: string, reason?: string) {
    // Make sure the 'reason' field is present, if net, use default
    if (reason === "" || reason === null || reason === undefined) {
        reason = "Despedimento por opção própria";
    }

    // Set the fired column to true and add a value to the fire_reason column
    await queryDB(force, "UPDATE officers SET fired = 1, fire_reason = ? WHERE nif = ?", [reason, nif]);

    // Delete the account of the fired officer (tokens are automatically deleted when the account is deleted)
    await queryDB(force, "DELETE FROM users WHERE nif = ?", nif);
}