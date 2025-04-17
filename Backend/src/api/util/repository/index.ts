import {
    EvaluationDecision,
    EvaluationField,
    EvaluationGrade,
    InactivityTypeData,
    IntentData,
    PatentData, PatrolTypeData,
    SpecialUnitData,
    SpecialUnitRoleData,
    StatusData
} from "@portalseguranca/api-types/util/output";
import {queryDB} from "../../../utils/db-connector";
import {OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {dateToUnix} from "../../../utils/date-handler";
import {getOfficerData} from "../../officers/repository";
import {InnerOfficerData} from "../../../types";

export async function getForcePatents(force: string, patent_id?: number): Promise<PatentData[] | PatentData | null> {
    // Get the list from the database
    const patents = await queryDB(force, `SELECT * FROM patents ${patent_id ? `WHERE id = ${patent_id}` : ""}`, patent_id);

    // * If a patent_id was passed, return the patent data
    if (patent_id) {
        if (patents.length === 0) {
            return null;
        }

        return {
            id: patents[0].id as number,
            name: patents[0].name as string,
            max_evaluation: patents[0].max_evaluation as number,
            leading_char: patents[0].leading_char as string
        };
    }

    // Build an array with the patents
    const patentsList: PatentData[] = [];
    for (const patent of patents) {
        patentsList.push({
            id: patent.id as number,
            name: patent.name as string,
            max_evaluation: patent.max_evaluation as number,
            leading_char: patent.leading_char as string
        });
    }

    return patentsList;
}

export async function getForceStatuses(force: string): Promise<StatusData[]> {
    // Get the list from the database
    const statuses = await queryDB(force, `SELECT * FROM status`);

    // Build an array with the statuses
    const statusesList: StatusData[] = [];
    for (const status of statuses) {
        statusesList.push({
            id: status.id as number,
            name: status.name as string,
            color: status.color as string,
            canPatrol: status.can_patrol === 1
        });
    }

    return statusesList;
}

export async function getForceSpecialUnits(force: string): Promise<SpecialUnitData[]> {
    // Get the list from the database
    const units = await queryDB(force, `SELECT * FROM special_units`);

    // Build an array with the units
    const unitsList: SpecialUnitData[] = [];
    for (const unit of units) {
        unitsList.push({
            id: unit.id as number,
            name: unit.name as string,
            acronym: unit.acronym as string,
            description: unit.description as string | null
        });
    }

    return unitsList;
}

export async function getForceSpecialUnitsRoles(force: string): Promise<SpecialUnitRoleData[]> {
    // Get the list from the database
    const roles = await queryDB(force, `SELECT * FROM specialunits_roles`);

    // Build an array with the roles
    const rolesList: SpecialUnitRoleData[] = [];
    for (const role of roles) {
        rolesList.push({
            id: role.id as number,
            name: role.name as string
        });
    }

    return rolesList;
}

export async function getSpecialUnitActiveMembers(force: string, unit_id: number): Promise<InnerOfficerData[]> {
    // Query the database to get the NIFs of every member of the special unit
    const result = await queryDB(force, "SELECT officer FROM specialunits_officers WHERE unit = ? ORDER BY role DESC", [unit_id]);

    // Loop through every row and fetch the officer data
    const officers: InnerOfficerData[] = [];
    for (const row of result) {
        // Fetch the officer data
        const data = await getOfficerData(row.officer as number, force, false, false);

        // If no officer was found, skip it
        if (!data) continue;

        // Append the result to the officers list
        officers.push(data);
    }

    return officers;
}

export async function getForceIntents(force: string): Promise<IntentData[]> {
    // Get the list from the database
    const intents = await queryDB(force, `SELECT * FROM intents`);

    // Build an array with the statuses
    const intentsList: IntentData[] = [];
    for (const intent of intents) {
        intentsList.push({
            name: intent.name as string,
            description: intent.description as string
        });
    }

    return intentsList;
}

export async function getForceInactivityTypes(force: string): Promise<InactivityTypeData[]> {
    // Get the list from the database
    const types = await queryDB(force, `SELECT * FROM inactivity_types`);

    // Build an array with the types
    const typesList: InactivityTypeData[] = [];
    for (const type of types) {
        typesList.push({
            id: type.id as number,
            name: type.name as string,
            description: type.description as string,
            color: type.color as string,
            status: type.status as number | null
        });
    }

    return typesList;
}

export async function getForcePatrolTypes(force: string): Promise<PatrolTypeData[]> {
    // Get the list from the database
    const types = await queryDB(force, `SELECT * FROM patrols_types`);

    // Build an array with the types
    const typesList: PatrolTypeData[] = [];
    for (const type of types) {
        typesList.push({
            id: type.id as number,
            name: type.name as string,
            isSpecial: Number(type.special) === 1
        })
    }

    return typesList;
}

export async function getEvaluationGrades(force: string): Promise<EvaluationGrade[]> {
    // Get the list from the database
    const result = await queryDB(force, `SELECT * FROM evaluation_grades`);

    // Build an array with the grades
    const gradesList: EvaluationGrade[] = [];
    for (const grade of result) {
        gradesList.push({
            id: grade.id as number,
            name: grade.name as string,
            color: grade.color as string
        });
    }

    return gradesList;
}

export async function getEvaluationFields(force: string): Promise<EvaluationField[]> {
    // Get the list from the database
    const result = await queryDB(force, `SELECT * FROM evaluation_fields`);

    // Build an array with the fields
    const fieldsList: EvaluationField[] = [];
    for (const field of result) {
        fieldsList.push({
            id: field.id as number,
            name: field.name as string,
            starting_patent: field.starting_patent as number
        });
    }

    return fieldsList;
}

export async function getEvaluationDecisions(force: string): Promise<EvaluationDecision[]> {
    // Get the list from the database
    const result = await queryDB(force, `SELECT * FROM evaluation_decisions`);

    // Build an array with the fields
    const fieldsList: EvaluationDecision[] = [];
    for (const field of result) {
        fieldsList.push({
            id: field.id as number,
            name: field.name as string,
            color: field.color as string
        });
    }

    return fieldsList;
}

export async function getLastCeremony(force: string): Promise<Date | null> {
    // Query the DB to fetch the last ceremony date
    const result = await queryDB(force, `SELECT date FROM last_ceremony LIMIT 1`);

    // If there is no result, there isn't a last ceremony
    if (result.length === 0) return null;

    return result[0].date as Date;
}

export async function updateLastCeremony(force: string, date: Date) {
    // Check if there already is a last ceremony stored
    const last = await getLastCeremony(force);

    // If there is no last ceremony, insert it
    if (!last) {
        await queryDB(force, `INSERT INTO last_ceremony (date) VALUES (FROM_UNIXTIME(?))`, dateToUnix(date));
        return;
    }

    // If there is a last ceremony, update it
    await queryDB(force, `UPDATE last_ceremony SET date = FROM_UNIXTIME(?)`, dateToUnix(date));
}

export async function getPendingInactivityJustifications(force: string, include_expired = false): Promise<(Omit<OfficerMinifiedJustification, "start" | "end" | "timestamp"> & {start: Date, end: Date | null, timestamp: Date, nif: number})[]> {
    // Fecth all pending justifications
    const justifications = include_expired ?
        await queryDB(force, "SELECT id, officer, type, start_date, end_date, status, managed_by, timestamp FROM officer_justifications WHERE status = ?", "pending") :
        await queryDB(force, "SELECT id, officer, type, start_date, end_date, status, managed_by, timestamp FROM officer_justifications WHERE status = ? AND end_date > ?", ["pending", new Date()]);

    return justifications.map((row) => ({
        id: row.id as number,
        type: row.type as number,
        start: row.start_date as Date,
        end: row.end_date as Date | null,
        status: row.status as "pending",
        managed_by: null,
        timestamp: row.timestamp as Date,
        nif: row.officer as number
    }));
}

export async function getUserErrors(force: string, nif: number) {
    // Get the list from the database
    const errors = await queryDB(force, `SELECT * FROM errors WHERE nif = ? AND reported = 0`, nif);

    // Build an array with the errors
    const errorsList: {code: string, timestamp: Date}[] = [];
    for (const error of errors) {
        errorsList.push({
            code: error.code as string,
            timestamp: error.timestamp as Date
        });
    }

    return errorsList;
}