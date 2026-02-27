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
    const envFileMap: Record<string, string> = {
        HTTP_PORT: "HTTP_PORT_FILE",
        GH_APP_ID: "GH_APP_ID_FILE",
        GH_APP_INSTALLATION_ID: "GH_INSTALLATION_ID_FILE",
        GH_REPO_OWNER: "GH_REPO_OWNER_FILE",
        GH_REPO_NAME: "GH_REPO_NAME_FILE",
        DISCORD_CLIENT_ID: "DISCORD_CLIENT_ID_FILE",
        DISCORD_CLIENT_SECRET: "DISCORD_CLIENT_SECRET_FILE",
        SESSION_SECRET: "SESSION_SECRET_FILE",
    };

    // * Make sure all required environment variables are set
    for (const envVar of ENVIRONMENT_FIELDS) {
        if (!process.env[envVar]) {
            const fileEnvVar = envFileMap[envVar];
            const filePath = fileEnvVar ? process.env[fileEnvVar] : undefined;

            if (filePath && fs.existsSync(filePath)) {
                const fileValue = fs.readFileSync(filePath, "utf-8").trim();
                if (fileValue.length > 0) {
                    process.env[envVar] = fileValue;
                }
            }
        }

        if (!process.env[envVar]) {
            throw Error(`Environment variable ${envVar} is required.`);
        }
    }
}