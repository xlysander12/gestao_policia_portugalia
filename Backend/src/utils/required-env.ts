import fs from "fs";
import path from "node:path";
import {ENVIRONMENT_FIELDS} from "./constants";

export function requiredFilesExist() {
    // * Make sure both the GitHub APP Key and the Google Sheets Key exist
    // GitHub APP
    if (!fs.existsSync(path.join(__dirname, "..", "assets", "github-issues-app.pem"))) {
        throw Error("GitHub APP Key not found. File named `github-issues-app.pem` at 'src/assets' is required.");
    }

    // Google Sheets
    if (!fs.existsSync(path.join(__dirname, "..", "assets", "google-creds.json"))) {
        throw Error("Google Sheets Key not found. File named `google-creds.json` at 'src/assets' is required.");
    }
}

export function requiredEnvVarsExist() {
    // * Make sure all required environment variables are set
    for (const envVar of ENVIRONMENT_FIELDS) {
        if (!process.env[envVar]) {
            throw Error(`Environment variable ${envVar} is required.`);
        }
    }
}