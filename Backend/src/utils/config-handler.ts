import fs from "fs";
import {join} from "path";

import {ConfigTypes, StaticConfigTypes} from "../types";
import {logToConsole} from "./logger";

let config: StaticConfigTypes = ConfigTypes.check(JSON.parse(fs.readFileSync(join(__dirname, "..", "assets", "config.sample.json"), "utf-8")));

export function getDatabaseConnetionDetails() {
    return config.database;
}

export function getAllForces() {
    return Object.keys(config.forces).filter(force => !force.startsWith("__"));
}

export function getForceDatabase(force: string) {
    return config.forces[force].database;
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

export function getForceHubPatentRange(force: string, patent: number): null | {start: number, end: number} | {start: number, end: number}[] {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub?.ranges.patents[String(patent)]) {
        return null;
    }

    if (Array.isArray(forceConfig.hub.ranges.patents[String(patent)])) {
        return (forceConfig.hub.ranges.patents[String(patent)] as {start: number, end: number}[]).map(range => {
           return {start: range.start, end: range.end} 
        });
    }
    
    return {
        start: (forceConfig.hub.ranges.patents[String(patent)] as {start: number, end: number}).start,
        end: (forceConfig.hub.ranges.patents[String(patent)] as {start: number, end: number}).end
    };
}

export function getForceHubPropertyPosition(force: string, property: string) {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return null;
    }

    return forceConfig.hub.ranges.properties[property] - 1;
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

export function getForcePromotionExpression(force: string): string {
    return config.forces[force].isPromotion;
}

export function getForcesList(): string[] {
    return Object.keys(config.forces);
}

export function isHubRowReadable(force: string, row: number): boolean {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return false;
    }

    // Loop through all the patents present in the hub configuration in the config file
    for (const patent in forceConfig.hub.ranges.patents) {
        // If the row is in the range of the patent, return true
        const patent_range = getForceHubPatentRange(force, parseInt(patent))!;
        if (!Array.isArray(patent_range)) {
            if (row >= patent_range.start && row <= patent_range.end) {
                return true;
            }
        } else {
            for (const entry of patent_range) {
                if (row >= entry.start && row <= entry.end) {
                    return true;
                }
            }
        }
    }

    // If it's not in any of the patents, check if it is in the inactive section
    return row >= forceConfig.hub.ranges.inactive.start && row <= forceConfig.hub.ranges.inactive.end;
}

export function loadConfig() {
    if (!fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
        // Since the config file doesn't exist, create a new one based on the sample
        logToConsole("Config file doesn't exist, creating a new one based on the sample", "info");
        fs.copyFileSync(join(__dirname, "..", "assets", "config.sample.json"), join(__dirname, "..", "..","config.json"));
    } else { // Since the config file exists, check if it's valid
        // Read the config file
        const file = JSON.parse(fs.readFileSync(join(__dirname, "..", "..","config.json"), "utf-8")) as StaticConfigTypes;

        // Check if the config file is valid
        config = ConfigTypes.check(file);

        logToConsole("Config file validated and loaded", "info");
    }
}