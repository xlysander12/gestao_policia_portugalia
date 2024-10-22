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

// TODO: Return type should be a proper object
export async function isTokenValid(token: string, force: ForceType) {
    // If token is undefined, return false as the token is invalid
    if (token === undefined) return [false, 401];

    // If the force is undefined, check all forces for the token
    if (force === undefined) {
        return [false, 400];
    }

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

type userForcesReturn = {force: string, password?: string, suspended: boolean}[];
export async function getUserForces(nif: number, return_passwords = false): Promise<userForcesReturn> {
    let user_forces: userForcesReturn = [];

    // Loop through all forces and see which of them have an account for this user
    for (const force of FORCES) {
        const queryResult = await queryDB(force, 'SELECT password, suspended FROM users WHERE nif = ?', nif);
        if (queryResult.length !== 0 ) { // This user exists in this force
            let to_push: {force: string, password?: string, suspended: boolean} = {force: force, suspended: queryResult[0].suspended === 1}

            if (return_passwords) { // If the option to retrieve passwords is true, add the password to the object
                to_push.password = queryResult[0].password;
            }

            // Push the object to the final array
            user_forces.push(to_push);
        }
    }

    return user_forces;
}

export async function updateLastTimeTokenUsed(token: string) {
    for (const force of FORCES) {
        await queryDB(force, 'UPDATE tokens SET last_used = ? WHERE token = ?', [new Date(), token]);
    }
}

export async function updateLastTimeUserInteracted(nif: number) {
    for (const force of FORCES) {
        await queryDB(force, 'UPDATE users SET last_interaction = ? WHERE nif = ?', [new Date(), nif]);
    }
}