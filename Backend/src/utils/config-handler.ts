import fs from "fs";
import {join} from "path";
import {ConfigTypes, StaticConfigTypes} from "../types";
import {logToConsole} from "./logger";

let config: StaticConfigTypes = ConfigTypes.check(JSON.parse(fs.readFileSync(join(__dirname, "..", "assets", "config.sample.json"), "utf-8")));

export function loadConfig() {
    if (!fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
        // Since the config file doesn't exist, create a new one based on the sample
        logToConsole("Config file doesn't exist, creating a new one based on the sample", "info");
        fs.copyFileSync(join(__dirname, "..", "assets", "config.sample.json"), join(__dirname, "..", "..","config.json"));
    } else { // Since the config file exists, check if it's valid
        // Read the config file
        const file = JSON.parse(fs.readFileSync(join(__dirname, "..", "..","config.json"), "utf-8"));

        // Check if the config file is valid
        config = ConfigTypes.check(file);

        logToConsole("Config file validated and loaded", "info");
    }
}

export function getDatabaseConnetionDetails() {
    return config.database;
}

export function getForceDatabase(force: string) {
    return config.forces[force].database;
}

export function getForcesList(): string[] {
    return Object.keys(config.forces);
}

export function getForcePromotionExpression(force: string): string {
    return config.forces[force].isPromotion;
}

export function getForceDefaultPatents(force: string) {
    return config.forces[force].patents;
}

export function getForceInactiveStatus(force: string) {
    return config.forces[force].inactive_status;
}

export function getForceInactivityJustificationType(force: string) {
    return config.forces[force].inactivity_justification_type;
}

export function getForceMaxNonWorkingDays(force: string) {
    return config.forces[force].maximum_non_working_days;
}

export function getForceMinWeekMinutes(force: string) {
    return config.forces[force].minimum_week_minutes;
}

export function getForcePatrolForces(force: string) {
    return config.forces[force].patrols;
}

export function getForceHubDetails(force: string) {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return null;
    }

    return {
        id: forceConfig.hub.id,
        sheet: forceConfig.hub.sheetName
    };
}

export function getForceHubPatentRange(force: string, patent: number) {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return null;
    }

    return {
        start: forceConfig.hub.ranges.patents[String(patent)].start - 1,
        end: forceConfig.hub.ranges.patents[String(patent)].end - 1
    };
}

export function getForceHubPropertyPosition(force: string, property: string) {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return null;
    }

    return forceConfig.hub.ranges.properties[property] - 1;
}

export function isHubRowReadable(force: string, row: number): boolean {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return false;
    }

    // Loop through all the patents present in the hub configuration in the config file
    for (const patent in forceConfig.hub!.ranges.patents) {
        // If the row is in the range of the patent, return true
        const {start, end} = getForceHubPatentRange(force, parseInt(patent))!;
        if (row >= start && row <= end) {
            return true;
        }
    }

    // If it's not in any of the patents, check if it is in the inactive section
    return row >= forceConfig.hub!.ranges.inactive.start && row <= forceConfig.hub!.ranges.inactive.end;
}