import * as crypto from "crypto";
import {getForcesList} from "./config-handler";
import {queryDB} from "./db-connector";

export function hashSessionId(sessionId: string) {
    return crypto.createHmac("sha256", process.env.SESSION_SECRET!).update(sessionId).digest("hex");
}

export async function generateSessionId() {
    // Repeat the generation process until an unique sessionId is generated
    let unique = false;
    let sessionId = "";
    while (!unique) {
        // Generate a random sessionId
        sessionId = crypto.randomBytes(32).toString("hex");

        // After generating the sessionId, hash it and check if it already exists
        const hashed = hashSessionId(sessionId);

        let exists = false;
        for (const force of getForcesList()) {
            const result = await queryDB(force, 'SELECT * FROM sessions WHERE session = ?', hashed);
            if (result.length !== 0) {
                exists = true;
                break;
            }
        }

        // If the sessionId doesn't exist, set unique to true
        unique = !exists;
    }

    // Return the sessionId
    return sessionId;
}

export async function isSessionValid(sessionId: string | undefined, force: string | undefined): Promise<{valid: boolean, status: number, nif?: number}> {
    // If sessionId is undefined, return false as the sessionId is invalid
    if (sessionId === undefined) return {valid: false, status: 401};

    // If the force is undefined, check all forces for the sessionId
    if (force === undefined) {
        return {valid: false, status: 400};
    }

    // Hash the sessionId
    const hashed = hashSessionId(sessionId);

    // Query the database to check if the sessionId exists
    const result = await queryDB(force, 'SELECT nif FROM sessions WHERE session = ?', hashed);
    if (result.length === 0) return {valid: false, status: 401};

    // Return true and the corresponding user if the sessionId exists
    return {valid: true, status: 200, nif: result[0].nif as number};
}