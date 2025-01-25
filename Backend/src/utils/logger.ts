import pc from "picocolors";
import fs from "fs";
import fsa from "fs/promises";
import path from "node:path";
import {APIResponse} from "../types";
import {formatDateTime} from "./date-handler";
import {FORCE_HEADER} from "./constants";

let logFile: string;

export function initializeLogFile() {
    // Make sure the logs directory exists
    const logsDir = path.join(__dirname, "..", "..", "logs");
    if (!fs.existsSync(logsDir)) {
        logToConsole(`Logs directory doesn't exist. Creating it...`, "info");
        fs.mkdirSync(logsDir);
    }

    // Delete any files that have 0 bytes
    fs.readdirSync(logsDir).forEach(file => {
        const filePath = path.join(logsDir, file);
        if (fs.statSync(filePath).size === 0) {
            fs.unlinkSync(filePath);
        }
    });

    // See if there is a "latest.log" file. If there is, rename it to the last edited date
    const latestLogPath = path.join(__dirname, "..", "..", "logs", "latest.log");
    if (fs.existsSync(latestLogPath)) {
        const date = fs.statSync(latestLogPath).mtime;

        const newName = `${date.toISOString().split("T")[0]}.log`;
        // If there already is a file with that name, count how many and add that number to the end
        let i = 0;
        while (fs.existsSync(path.join(logsDir, i === 0 ? newName: newName.replace(".log", `--${i}.log`)))) {
            i++;
        }

        fs.renameSync(latestLogPath, path.join(logsDir, i === 0 ? newName: newName.replace(".log", `--${i}.log`)));
    }

    // Create the file
    fs.writeFileSync(latestLogPath, "");
    logToConsole(`Log file created at ${pc.gray(pc.italic(latestLogPath))}`, "info");

    // Set the global variable that holds the path to the latest log file
    logFile = latestLogPath;
}

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function colorFromMethod(method: string) {
    switch (method) {
        case "GET":
            return pc.green;
        case "POST":
            return pc.yellow;
        case "PUT":
            return pc.blue;
        case "PATCH":
                return pc.magenta;
        case "DELETE":
            return pc.red;
        default:
            return pc.white;
    }
}

export function colorFromHTTPCode(code: number) {
    if (code >= 500) { // Server error
        return pc.red;
    } else if (code >= 400) { // Client error
        return pc.yellow;
    } else if (code >= 300) { // Redirect
        return pc.cyan;
    } else if (code >= 200) { // Success
        return pc.green;
    } else { // Informational
        return pc.blue;
    }
}

function logTypeColorFromString(type: "info" | "warning" | "error") {
    switch (type) {
        case "info":
            return pc.blueBright;
        case "warning":
            return pc.yellowBright;
        case "error":
            return pc.redBright;
        default:
            return pc.white;
    }

}

export function logToConsole(message: string, type?: "info" | "warning" | "error", outputToFile = false) {
    const finalMessage = `${pc.blue("[Portal Segurança]")} [${formatDateTime(new Date())}]${type ? ` [${logTypeColorFromString(type)(capitalizeFirstLetter(type))}]`: ""} ${message}`;
    const finalMessageNoColors = finalMessage.replace(/\u001b\[.*?m/g, "");

    console.log(pc.isColorSupported ? finalMessage: finalMessageNoColors);

    if (outputToFile) {
        // logToConsole("Outputting to file is DISABLED", "warning");

        let fileLogBuilder = "=================== // ====================\n";

        // Add the message to the builder
        fileLogBuilder += finalMessageNoColors + "\n";

        // Append the message to the file
        fsa.appendFile(logFile, fileLogBuilder);
    }
}

export async function logRequestToFile(res: APIResponse) {
    if (!res.locals.routeDetails) {
        logToConsole(`Route details not present in response oject. Skipping logging... [${res.req.originalUrl} - ${res.req.method}]`, "warning");
        return;
    }

    let builder = "=================== // ====================\n";

    // Add the line with the Method, URL, status code and timestamp
    builder += `${res.req.method} ${res.req.originalUrl} - ${res.statusCode} @ ${formatDateTime(new Date())}\n`;

    // Add the line with the source IP address
    builder += `Source IP: ${res.req.socket.remoteAddress}\n`;

    // Add the line with the force, if applicable
    builder += `Force: ${res.locals.routeDetails.requiresForce ? (res.req.header(FORCE_HEADER) ? res.req.header(FORCE_HEADER)!.toUpperCase(): "Force not Present"): "N/A"}\n`;

    // Add the line with the Logged User, if applicable
    builder += `Logged User: ${res.locals.routeDetails.requiresToken ? (res.locals.loggedOfficer ? res.locals.loggedOfficer.nif: "User not Logged In"): "N/A"}\n`;

    // Add a line with the request body, if applicable
    if (res.locals.routeDetails.body !== undefined) { // Make sure this route is supposed to have a body
        // Add a blank line
        builder += "\n";

        // If the route is either the login or change-password, don't log the body to prevent leaking sensitive information
        if (res.req.originalUrl.includes("login") || res.req.originalUrl.includes("change-password")) {
            builder += "[Body not logged to prevent leaking sensitive information]\n";
        } else {
            builder += `${JSON.stringify(res.req.body)}\n`;
        }
    }

    // After everything has been added to the string, write it to the file
    await fsa.appendFile(logFile, builder);
}