import {
    IntentData,
    PatentData,
    SpecialUnitData,
    SpecialUnitRoleData,
    StatusData
} from "@portalseguranca/api-types/util/schema";
import {queryDB} from "../../../utils/db-connector";

export async function getForcePatents(force: string, patent_id?: number): Promise<PatentData[]> {
    // Get the list from the database
    const patents = await queryDB(force, `SELECT * FROM patents ${patent_id ? `WHERE id = ${patent_id}` : ""}`, patent_id);

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
            name: status.name
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