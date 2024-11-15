import fs from "fs";
import {join} from "path";
import {ConfigTypes, StaticConfigTypes} from "../assets/config-types";

let config: StaticConfigTypes = ConfigTypes.check(JSON.parse(fs.readFileSync(join(__dirname, "..", "assets", "config.sample.json"), "utf-8")));

export function loadConfig() {
    if (!fs.existsSync(join(__dirname, "..", "..", "config.json"))) {
        // Since the config file doesn't exist, create a new one based on the sample
        fs.copyFileSync(join(__dirname, "..", "assets", "config.sample.json"), join(__dirname, "..", "..","config.json"));
    } else { // Since the config file exists, check if it's valid
        // Read the config file
        const file = JSON.parse(fs.readFileSync(join(__dirname, "..", "..","config.json"), "utf-8"));

        // Check if the config file is valid
        config = ConfigTypes.check(file);

        console.log("Config file is valid");
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