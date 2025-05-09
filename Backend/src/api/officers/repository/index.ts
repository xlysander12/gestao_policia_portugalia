import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {isQueryParamPresent, ReceivedQueryParams} from "../../../utils/filters";
import {paramsTypes, queryDB} from "../../../utils/db-connector";
import {
    MinifiedOfficerData,
    OfficerUnit
} from "@portalseguranca/api-types/officers/output";
import {InnerOfficerData} from "../../../types";
import {UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {getOfficerActiveJustifications} from "../subroutes/activity/justifications/repository";
import {getForceInactivityTypes} from "../../util/repository";

export async function getOfficersList(force: string, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams, check_inactivity = true) {
    if (filters && !routeValidFilters) throw new Error("routeValidFilters must be present when filters are passed");

    const useFilters = routeValidFilters && filters;

    const filtersResult = useFilters ? buildFiltersQuery(routeValidFilters, filters) : null;

    // Check if the "patrol" query param is present
    const isPatrol = useFilters ? isQueryParamPresent("patrol", filters) && filters.patrol === "true" : false;

    // * Get the data from the database
    let officersListResult;
    if (isPatrol) {
        officersListResult = await queryDB(force, `SELECT name, patent, callsign, status, nif, officerForce FROM officersVPatrols ${filtersResult ? filtersResult.query: ""}`, filtersResult ? filtersResult.values : []);
    } else {
        officersListResult = await queryDB(force, `SELECT name, patent, callsign, status, nif FROM officersV ${filtersResult ? filtersResult.query : ""}`, filtersResult ? filtersResult.values : []);
    }

    // Get the data from all the officer's and store in array
    let officersList: MinifiedOfficerData[] = [];
    for (const officer of officersListResult) {
        let officerData: MinifiedOfficerData

        // * Check if the officer has any active "inactivity type" justifications
        if (check_inactivity) {
            // Get the officer's active justifications
            const justifications = await getOfficerActiveJustifications(force, officer.nif as number);

            // Check if any of the justifications have an associated status
            let justificationStatus: number |  undefined;
            for (const justification of justifications) {
                // Get the justification type object from the DB
                const type = (await getForceInactivityTypes(force)).find(type => type.id === justification.type)!;

                // If the type has an associated status, store it in the variable
                if (type.status) {
                    justificationStatus = type.status;
                    break;
                }
            }

            // Build officer data
            officerData = {
                name: officer.name as string,
                patent: officer.patent as number,
                callsign: officer.callsign as string,
                status: justificationStatus ?? officer.status as number,
                nif: officer.nif as number,
                force: isPatrol ? officer.officerForce as string : undefined
            }
        } else {
            // Build officer data
            officerData = {
                name: officer.name as string,
                patent: officer.patent as number,
                callsign: officer.callsign as string,
                status: officer.status as number,
                nif: officer.nif as number,
                force: isPatrol ? officer.officerForce as string : undefined
            }
        }

        // Push the officer's data to the list
        officersList.push(officerData);
    }

    // If the "patrol" query param is present, there is a chance there are duplicated entries due to officers being in multiple forces
    // If so, remove the duplicates nifs
    if (useFilters && isQueryParamPresent("patrol", filters) && filters.patrol === "true") {
        officersList = officersList.filter((officer, index, self) => self.findIndex(t => (t.nif === officer.nif)) === index);
    }

    return officersList;
}

export async function getOfficerUnits(force: string, nif: number): Promise<OfficerUnit[]> {
    // * Get the data from the database
    const officerUnitsResult = await queryDB(force, `SELECT unit, role
                                                     FROM specialunits_officers
                                                     WHERE officer = ?`, nif);

    // Get the data from all the officer's units and store in array
    const officerUnits: OfficerUnit[] = [];
    for (const unit of officerUnitsResult) {
        // Build officer unit
        const officerUnit = {
            id: unit.unit as number,
            role: unit.role as number
        }

        officerUnits.push(officerUnit);
    }

    return officerUnits;
}

export async function getOfficerData(nif: number, force: string, former = false, check_justification = true): Promise<InnerOfficerData | null> {
    // * Get the data from the database
    const officerDataResult = await queryDB(force, `SELECT *
                                              FROM officers
                                              WHERE nif = ? AND fired = ? LIMIT 1`, [nif, former ? 1: 0]);

    // Check if the officer exists
    if (officerDataResult.length === 0) {
        return null;
    }

    // * Check if the officer has any active "inactivity type" justifications
    let justificationStatus: number |  undefined;
    if (check_justification) {
        // Get the officer's active justifications
        const justifications = await getOfficerActiveJustifications(force, nif);

        // Check if any of the justifications have an associated status
        for (const justification of justifications) {
            // Get the justification type object from the DB
            const type = (await getForceInactivityTypes(force)).find(type => type.id === justification.type)!;

            // If the type has an associated status, store it in the variable
            if (type.status) {
                justificationStatus = type.status;
                break;
            }
        }
    }

    // Return the officer data
    return {
        name: officerDataResult[0].name as string,
        patent: officerDataResult[0].patent as number,
        callsign: officerDataResult[0].callsign as string | null,
        status: justificationStatus ?? officerDataResult[0].status as number,
        entry_date: officerDataResult[0].entry_date as Date,
        promotion_date: officerDataResult[0].promotion_date as Date | null,
        phone: officerDataResult[0].phone as number,
        nif: officerDataResult[0].nif as number,
        iban: officerDataResult[0].iban as string,
        kms: officerDataResult[0].kms as number,
        discord: officerDataResult[0].discord as number,
        steam: officerDataResult[0].steam as string,
        special_units: await getOfficerUnits(force, nif),
        isFormer: former,
        force: force,
        fire_reason: officerDataResult[0].fire_reason as string | null
    };
}

export async function getNextAvailableCallsign(startingLetter: string, force: string) {
    // * Get the data from the database
    const callsignsResult = await queryDB(force, `SELECT callsign
                                                 FROM officers
                                                 WHERE officers.fired = 0 AND callsign LIKE ? ORDER BY callsign DESC`, `${startingLetter}%`);

    // Get the next callsign number
    let callsignNumber = 1;
    if (callsignsResult.length > 0) {
        callsignNumber = (Number.parseInt((callsignsResult[0].callsign as string).split("-")[1]) + 1);
    }

    return `${startingLetter}-${callsignNumber.toString().padStart(2, "0")}`;
}

export async function addOfficer(force: string, name: string, patent: number, callsign: string | null, phone: number, nif: number, iban: string, kms: number, discord: number,
                                 steam = "steam:0") {
    // * Add the officer to the database
    await queryDB(force, 'INSERT INTO officers (name, patent, callsign, phone, nif, iban, kms, discord, steam) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, patent, callsign, phone, nif, iban, kms, discord, steam]);
}

export async function updateOfficer(nif: number, force: string, changes: UpdateOfficerRequestBody, isPromotion: boolean) {
    const validFields = ["name", "patent", "callsign", "status", "entry_date", "promotion_date", "phone", "iban", "kms", "discord", "steam"];

    // Check if the officer has any active inactivity justifications
    const officerActiveJustifications = await getOfficerActiveJustifications(force, nif);
    let justificationStatus: number |  undefined;

    // Check if any of the justifications have an associated status
    for (const justification of officerActiveJustifications) {
        // Get the justification type object from the DB
        const type = (await getForceInactivityTypes(force)).find(type => type.id === justification.type)!;

        // If the type has an associated status, store it in the variable
        if (type.status) {
            justificationStatus = type.status;
            break;
        }
    }

    // Build the query string and params depending on the fields that were provided
    const params: paramsTypes[] = [];
    const updateQuery = `UPDATE officers SET ${validFields.reduce((acc, field) => {
        if (changes[field as keyof UpdateOfficerRequestBody] !== undefined) {
            if (field === "entry_date" || field === "promotion_date") {
                acc += `${field} = FROM_UNIXTIME(?), `;
            } else if (field === "status" && changes.status === justificationStatus) {
                // If the user is trying to set the status to one that is already defined by an active justification, skip this field
                return acc;
            } else {
                acc += `${field} = ?, `;
            }
            
            params.push(changes[field as keyof UpdateOfficerRequestBody] as paramsTypes);
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
    // Make sure the 'reason' field is present, if not, use default
    reason ??= "Despedimento por opção própria";

    // Set the fired column to true and add a value to the fire_reason column
    await queryDB(force, "UPDATE officers SET fired = 1, fire_reason = ? WHERE nif = ?", [reason, nif]);

    // Delete the account of the fired officer (tokens are automatically deleted when the account is deleted)
    await queryDB(force, "DELETE FROM users WHERE nif = ?", nif);
}

export async function eraseOfficer(nif: number, force: string) {
    await queryDB(force, 'DELETE FROM officers WHERE nif = ?', nif);
}

export async function reHireOfficer(nif: number, force: string, callsign: string) {
    await queryDB(force, 'UPDATE officers SET fired = 0, fire_reason = NULL, patent = ?, callsign = ?, entry_date = CURRENT_TIMESTAMP WHERE nif = ?', [1, callsign, nif]);
}