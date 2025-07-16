import {queryDB} from "./db-connector";
import {logToConsole} from "./logger";
import pc from "picocolors";

/**
 * This function aims to ensure that every table with fixed rows has, at least 1 row
 * (Some tables might have more rules)
 * @param force
 * @throws Error - When a specific table doesn't meet row criteria
 * @return void
 */
export async function ensureRowsInTables(force: string) {
    logToConsole(pc.yellow(`Starting table verification process for force ${force}`), "info");

    // Evaluation Fields
    if ((await queryDB(force, "SELECT * FROM evaluation_fields")).length === 0) {
        throw new Error(`Force ${force} doesn't have Evaluation Fields`);
    }

    // Evaluation Grades
    if ((await queryDB(force, "SELECT * FROM evaluation_grades")).length === 0) {
        throw new Error(`Force ${force} doesn't have Evaluation Grades`);
    }

    // Event Types (This table must have at least 1 row with the "custom" variant)
    if ((await queryDB(force, "SELECT * FROM event_types WHERE variant = 'custom'")).length === 0) {
        throw new Error(`Force ${force} doesn't have a custom Event Type`);
    }

    // Inactivity Types
    if ((await queryDB(force, "SELECT * FROM inactivity_types")).length === 0) {
        throw new Error(`Force ${force} doesn't have Inactivity Types`);
    }

    // Intents (All existing intents must be present)
    for (const intent of ["accounts", "activity", "evaluations", "events", "officers", "patrols"]) {
        if ((await queryDB(force, "SELECT * FROM intents WHERE name = ?", intent)).length === 0) {
            throw new Error(`Force ${force} doesn't have the '${intent}' intent`);
        }
    }

    // Patents
    if ((await queryDB(force, "SELECT * FROM patents")).length === 0) {
        throw new Error(`Force ${force} doesn't have Patents`);
    }

    // Special Unit Roles
    if ((await queryDB(force ,"SELECT * FROM specialunits_roles")).length === 0) {
        throw new Error(`Force ${force} doesn't have Special Unit Roles`);
    }

    // Patrol Types
    if ((await queryDB(force, "SELECT * FROM patrols_types")).length === 0) {
        throw new Error(`Force ${force} doesn't have Patrol Types`);
    }

    // Statuses (must have at least 1 status that allows patrolling)
    if ((await queryDB(force, "SELECT * FROM status WHERE can_patrol = 1")).length === 0) {
        throw new Error(`Force ${force} doesn't have Statuses that allow patrolling`);
    }

    logToConsole(pc.green(`Table verification for force ${force} completed`), "info");
}