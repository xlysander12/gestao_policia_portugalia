import {queryDB} from "../../../utils/db-connector";
import {getForcesList} from "../../../utils/config-handler";
import {InnerAccountData} from "../../../types/inner-types";

export async function isTokenValid(token: string, force: any): Promise<{valid: boolean, status: number, nif?: number}> {
    // If token is undefined, return false as the token is invalid
    if (token === undefined) return {valid: false, status: 401};

    // If the force is undefined, check all forces for the token
    if (force === undefined) {
        return {valid: false, status: 400};
    }

    // Query the database to check if the token exists
    const result = await queryDB(force, 'SELECT nif FROM tokens WHERE token = ?', token);
    if (result.length === 0) return {valid: false, status: 401};

    // Return true and the corresponding user if the token exists
    return {valid: true, status: 200, nif: Number(result[0].nif)};
}

export async function userHasIntents(nif: number, force: any, intent: string | string[]) {
    // Check if it is just one intent or an array of them
    if (Array.isArray(intent)) {
        // If it is an array, check all of them
        // Only return true if the user has all of them
        let hasAllIntents = true;
        for (const intentKey of intent) {
            const result = await queryDB(force, 'SELECT enabled FROM user_intents WHERE user = ? AND intent = ?', [nif, intentKey]);
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

type userForcesReturn = {name: string, password?: string, suspended: boolean}[];
export async function getUserForces(nif: number, return_passwords = false): Promise<userForcesReturn> {
    let user_forces: userForcesReturn = [];

    // Loop through all forces and see which of them have an account for this user
    for (const force of getForcesList()) {
        const queryResult = await queryDB(force, 'SELECT password, suspended FROM users WHERE nif = ?', nif);
        if (queryResult.length !== 0 ) { // This user exists in this force
            let to_push: {name: string, password?: string, suspended: boolean} = {name: force, suspended: queryResult[0].suspended === 1}

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
    for (const force of getForcesList()) {
        await queryDB(force, 'UPDATE tokens SET last_used = ? WHERE token = ?', [new Date(), token]);
    }
}

export async function updateLastTimeUserInteracted(nif: number) {
    for (const force of getForcesList()) {
        await queryDB(force, 'UPDATE users SET last_interaction = ? WHERE nif = ?', [new Date(), nif]);
    }
}

export async function getForceIntents(force: string): Promise<string[]> {
    // Get all possible intents
    const intentsQuery = await queryDB(force, 'SELECT name FROM intents');
    return intentsQuery.map((intent) => intent.name);
}

export async function getAccountDetails(force: string, nif: number): Promise<InnerAccountData | null> {
    // Fetch all the data related to the account from the database
    const result = await queryDB(force, 'SELECT * FROM users WHERE nif = ? LIMIT 1', nif);

    // If no user exists, return 404
    if (result.length === 0) {
        return null;
    }

    // Build the return object
    let details: InnerAccountData = {
        nif: result[0].nif,
        password: result[0].password,
        suspended: result[0].suspended === 1,
        last_interaction: result[0].last_interaction,
        intents: {}
    }

    // Get all possible intents
    const forceIntents = await getForceIntents(force);

    // After getting all intents, default them to false in the response
    forceIntents.forEach((intent) => {
        details.intents[intent] = false;
    });

    // Check if the user has the intents, one by one
    for (const forceIntent of forceIntents) {
        details.intents[forceIntent] = await userHasIntents(nif, force, forceIntent);
    }

    // Return the details of the Account
    return details;
}

export async function generateAccountToken() {
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
        for (const force of getForcesList()) {
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

export async function addAccountToken(force: string, nif: number, token: string, persistent: boolean) {
    await queryDB(force, 'INSERT INTO tokens (token, nif, persistent) VALUES (?, ?, ?)', [token, nif, persistent ? 1: 0]);
}

export async function updateAccountPassword(nif: number, hash: string, currentToken: string) {
    // Get the list of forces the user belongs to
    let userForces = await getUserForces(nif);

    // Update the password in all forces
    for (const force of userForces) {
        await queryDB(force.name, 'UPDATE users SET password = ? WHERE nif = ?', [hash, nif]);
    }

    // Delete all tokens from the user except the current one
    for (const force of userForces) {
        await queryDB(force.name, 'DELETE FROM tokens WHERE nif = ? AND token != ?', [nif, currentToken]);
    }
}

export async function addAccount(nif: number, force: string): Promise<void> {
    await queryDB(force, 'INSERT INTO users (nif) VALUES (?)', nif);
}

export async function clearAccountTokens(nif: number, force: string, exclude?: string): Promise<void> {
    if (exclude === undefined) {
        await queryDB(force, 'DELETE FROM tokens WHERE nif = ?', nif);
    } else {
        await queryDB(force, 'DELETE FROM tokens WHERE nif = ? AND token != ?', [nif, exclude]);
    }
}

export async function changeAccountSuspendedStatus(nif: number, force: string, suspended: boolean): Promise<void> {
    // Set the suspended status to true in the database
    await queryDB(force, 'UPDATE users SET suspended = ? WHERE nif = ?', [suspended ? 1 : 0, nif]);

    // Clear all tokens of the account, if it being suspended
    if (suspended) {
        await clearAccountTokens(nif, force);
    }
}

export async function changeAccountIntent(nif: number, force: string, intent: string, enabled: boolean): Promise<void> {
    // Check if the entry for this intent already exists
    if ((await queryDB(force, 'SELECT * FROM user_intents WHERE user = ? AND intent = ?', [nif, intent])).length === 0) { // Entry doesn't exist
        await queryDB(force, 'INSERT INTO user_intents (user, intent, enabled) VALUES (?, ?, ?)', [nif, intent, enabled ? 1 : 0]);
    } else { // Entry already exists
        await queryDB(force, 'UPDATE user_intents SET enabled = ? WHERE user = ? AND intent = ?', [enabled ? 1 : 0, nif, intent]);
    }
}

export async function deleteAccount(nif: number, force: string) {
    // Delete the account from the database
    await queryDB(force, 'DELETE FROM users WHERE nif = ?', nif);
}