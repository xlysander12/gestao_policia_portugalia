import fs from "fs";
import {join} from "path";

import {ConfigTypes, StaticConfigTypes} from "../types";
import {logToConsole} from "./logger";
import {ForceColors} from "@portalseguranca/api-types/util/output";

// Making sure the sample config is correct
let config: StaticConfigTypes = ConfigTypes.check(JSON.parse(fs.readFileSync(join(__dirname, "..", "assets", "config.sample.json"), "utf-8")));

export function getDiscordGuild() {
    return config.discord_guild;
}

export function getDatabaseDetails() {
    return config.database;
}

export function getAllForces() {
    return Object.keys(config.forces).filter(force => !force.startsWith("__"));
}

export function getForceColors(force: string): ForceColors {
    return {
        base: config.forces[force].colors.base,
        text: config.forces[force].colors.text ?? null
    }
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

export function getForceHubPropertyPosition(force: string, property: string) {
    const forceConfig = config.forces[force];

    if (!forceConfig.hub) {
        return null;
    }

    return forceConfig.hub.ranges.properties[property] - 1;
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

    // Loop through all the row ranges present in the config file
    for (const readableRange of forceConfig.hub.ranges.patents) {
        // readableRange can either be an Array with 2 or 1 element
        if (readableRange.length === 1) {
            if (row === readableRange[0]) return true;
        } else if (row >= readableRange[0] && row <= readableRange[1]) return true;
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