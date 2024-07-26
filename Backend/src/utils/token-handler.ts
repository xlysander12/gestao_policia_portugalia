import {FORCES, ForceType} from "./constants";
import {queryDB} from "./db-connector";

export async function generateToken() {
    // Repeat the generation process until an unique token is generated
    let unique = false;
    let token = "";
    while (!unique) {
        // Generate a random token
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        // After generating the token, check if it already exists
        let exists = false;
        for (const force of FORCES) {
            const result = await queryDB(force, 'SELECT * FROM tokens WHERE token = ?', token);
            if (result.length !== 0) {
                exists = true;
            }
        }

        // If the token doesn't exist, set unique to true
        unique = !exists;
    }

    // Return the token
    return token;
}

export async function isTokenValid(token: undefined | string, force: ForceType) {
    // If either token or force are undefined, return false as the token is invalid
    if (token === undefined) return [false, 401];
    if (force === undefined) return [false, 400];

    // Query the database to check if the token exists
    const result = await queryDB(force, 'SELECT nif FROM tokens WHERE token = ?', token);
    if (result.length === 0) return [false, 401];

    // Return true and the corresponding user if the token exists
    return [true, 200, result[0].nif];
}

export async function userHasIntents(nif: number, force: ForceType, intent: string | string[]) {
    // Check if it is just one intent or an array of them
    if (Array.isArray(intent)) {
        // If it is an array, check all of them
        // Only return true if the user has all of them
        let hasAllIntents = true;
        for (const intentKey of intent) {
            const result = await queryDB(force, 'SELECT enabled FROM user_intents WHERE user = ? AND intent = ?', [String(nif), intentKey]);
            if (result.length === 0 || result[0].enabled === 0) {
                hasAllIntents = false;
                break;
            }
        }
        return hasAllIntents;
    }

    // If it isn't an array, query the database to check if the user has the intent
    const result = await queryDB(force, 'SELECT enabled FROM user_intents WHERE user = ? AND intent = ?', [String(nif), intent]);
    return result.length !== 0 && result[0].enabled === 1;
}