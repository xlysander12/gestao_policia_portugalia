import {
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

export async function getForcePatents(force: string, patent_id?: number): Promise<PatentData[] | PatentData | null> {
    // Get the list from the database
    const patents = await queryDB(force, `SELECT * FROM patents ${patent_id ? `WHERE id = ${patent_id}` : ""}`, patent_id);

    // * If a patent_id was passed, return the patent data
    if (patent_id) {
        if (patents.length === 0) {
            return null;
        }

        return {
            id: patents[0].id,
            name: patents[0].name,
            max_evaluation: patents[0].max_evaluation,
            leading_char: patents[0].leading_char
        };
    }

    // Build an array with the patents
    let patentsList: PatentData[] = [];
    for (const patent of patents) {
        patentsList.push({
            id: patent.id,
            name: patent.name,
            max_evaluation: patent.max_evaluation,
            leading_char: patent.leading_char
        });
    }

    return patentsList;
}

export async function getForceStatuses(force: string): Promise<StatusData[]> {
    // Get the list from the database
    const statuses = await queryDB(force, `SELECT * FROM status`);

    // Build an array with the statuses
    let statusesList: StatusData[] = [];
    for (const status of statuses) {
        statusesList.push({
            id: status.id,
            name: status.name,
            color: status.color,
            canPatrol: status.can_patrol === 1
        });
    }

    return statusesList;
}

export async function getForceSpecialUnits(force: string): Promise<SpecialUnitData[]> {
    // Get the list from the database
    const units = await queryDB(force, `SELECT * FROM special_units`);

    // Build an array with the units
    let unitsList: SpecialUnitData[] = [];
    for (const unit of units) {
        unitsList.push({
            id: unit.id,
            name: unit.name,
            acronym: unit.acronym,
            description: unit.description
        });
    }

    return unitsList;
}

export async function getForceSpecialUnitsRoles(force: string): Promise<SpecialUnitRoleData[]> {
    // Get the list from the database
    const roles = await queryDB(force, `SELECT * FROM specialunits_roles`);

    // Build an array with the roles
    let rolesList: SpecialUnitRoleData[] = [];
    for (const role of roles) {
        rolesList.push({
            id: role.id,
            name: role.name
        });
    }

    return rolesList;
}

export async function getForceIntents(force: string): Promise<IntentData[]> {
    // Get the list from the database
    const intents = await queryDB(force, `SELECT * FROM intents`);

    // Build an array with the statuses
    let intentsList: IntentData[] = [];
    for (const intent of intents) {
        intentsList.push({
            name: intent.name,
            description: intent.description
        });
    }

    return intentsList;
}

export async function getForceInactivityTypes(force: string): Promise<InactivityTypeData[]> {
    // Get the list from the database
    const types = await queryDB(force, `SELECT * FROM inactivity_types`);

    // Build an array with the types
    let typesList: InactivityTypeData[] = [];
    for (const type of types) {
        typesList.push({
            id: type.id,
            name: type.name,
            description: type.description,
            color: type.color
        });
    }

    return typesList;
}

export async function getForcePatrolTypes(force: string): Promise<PatrolTypeData[]> {
    // Get the list from the database
    const types = await queryDB(force, `SELECT * FROM patrols_types`);

    // Build an array with the types
    let typesList: PatrolTypeData[] = [];
    for (const type of types) {
        typesList.push({
            id: type.id,
            name: type.name,
            isSpecial: Number(type.special) === 1
        })
    }

    return typesList;
}

export async function getEvaluationGrades(force: string): Promise<EvaluationGrade[]> {
    // Get the list from the database
    const result = await queryDB(force, `SELECT * FROM evaluation_grades`);

    // Build an array with the grades
    let gradesList: EvaluationGrade[] = [];
    for (const grade of result) {
        gradesList.push({
            id: grade.id,
            name: grade.name,
            color: grade.color
        });
    }

    return gradesList;
}

export async function getEvaluationFields(force: string): Promise<EvaluationField[]> {
    // Get the list from the database
    const result = await queryDB(force, `SELECT * FROM evaluation_fields`);

    // Build an array with the fields
    let fieldsList: EvaluationField[] = [];
    for (const field of result) {
        fieldsList.push({
            id: field.id,
            name: field.name,
            starting_patent: field.starting_patent
        });
    }

    return fieldsList;
}

export async function getPendingInactivityJustifications(force: string, include_expired: boolean = false): Promise<(Omit<OfficerMinifiedJustification, "start" | "end" | "timestamp"> & {start: Date, end: Date | null, timestamp: Date, nif: number})[]> {
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
    const errors = await queryDB(force, `SELECT * FROM errors WHERE nif = ?`, nif);

    // Build an array with the errors
    let errorsList: {code: string, timestamp: Date}[] = [];
    for (const error of errors) {
        errorsList.push({
            code: error.code,
            timestamp: error.timestamp
        });
    }

    return errorsList;
}