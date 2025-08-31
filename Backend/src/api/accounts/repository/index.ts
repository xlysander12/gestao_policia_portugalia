import {queryDB} from "../../../utils/db-connector";
import {getForcesList} from "../../../utils/config-handler";
import {InnerAccountData} from "../../../types/inner-types";
import {getForceIntents} from "../../util/repository";
import {hashSessionId} from "../../../utils/session-handler";

export async function userHasIntents(nif: number, force: string, intent: string | string[]) {
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

export type userForcesReturn = {name: string, password?: string | null, suspended: boolean}[];
export async function getUserForces(nif: number, return_passwords = false): Promise<userForcesReturn> {
    const user_forces: userForcesReturn = [];

    // Loop through all forces and see which of them have an account for this user
    for (const force of getForcesList()) {
        const queryResult = await queryDB(force, 'SELECT password, suspended FROM users WHERE nif = ?', nif);
        if (queryResult.length !== 0 ) { // This user exists in this force
            const to_push: {name: string, password?: string | null, suspended: boolean} = {name: force, suspended: queryResult[0].suspended === 1}

            if (return_passwords) { // If the option to retrieve passwords is true, add the password to the object
                to_push.password = queryResult[0].password as string | null;
            }

            // Push the object to the final array
            user_forces.push(to_push);
        }
    }

    return user_forces;
}

export async function updateLastTimeSessionUsed(sessionId: string) {
    for (const force of getForcesList()) {
        await queryDB(force, 'UPDATE sessions SET last_used = ? WHERE session = ?', [new Date(), hashSessionId(sessionId)]);
    }
}

export async function updateLastTimeUserInteracted(nif: number) {
    for (const force of getForcesList()) {
        await queryDB(force, 'UPDATE users SET last_interaction = ? WHERE nif = ?', [new Date(), nif]);
    }
}

export async function getAccountDetails(nif: number, force: string): Promise<InnerAccountData | null> {
    // Fetch all the data related to the account from the database
    const result = await queryDB(force, 'SELECT * FROM users WHERE nif = ? LIMIT 1', nif);

    // If no user exists, return 404
    if (result.length === 0) {
        return null;
    }

    // Build the return object
    const details: InnerAccountData = {
        nif: result[0].nif as number,
        password: result[0].password as string | null,
        suspended: result[0].suspended === 1,
        last_interaction: result[0].last_interaction as Date | null,
        intents: {}
    }

    // Get all possible intents
    const forceIntents = await getForceIntents(force);

    // After getting all intents, default them to false in the response
    forceIntents.forEach((intent) => {
        details.intents[intent.name] = false;
    });

    // Check if the user has the intents, one by one
    for (const forceIntent of forceIntents) {
        details.intents[forceIntent.name] = await userHasIntents(nif, force, forceIntent.name);
    }

    // Return the details of the Account
    return details;
}

export async function addAccountSession(force: string, nif: number, session_id: string, persistent: boolean) {
    await queryDB(force, 'INSERT INTO sessions (session, nif, persistent) VALUES (?, ?, ?)', [hashSessionId(session_id), nif, persistent ? 1: 0]);
}

export async function deleteAccountSession(force: string, nif: number, session_id: string) {
    await queryDB(force, 'DELETE FROM sessions WHERE nif = ? AND session = ?', [nif, hashSessionId(session_id)]);
}

export async function updateAccountPassword(nif: number, hash: string, current_session: string) {
    // Get the list of forces the user belongs to
    const userForces = await getUserForces(nif);

    // Update the password in all forces
    for (const force of userForces) {
        await queryDB(force.name, 'UPDATE users SET password = ? WHERE nif = ?', [hash, nif]);
    }

    // Delete all sessions from the user except the current one
    for (const force of userForces) {
        await queryDB(force.name, 'DELETE FROM sessions WHERE nif = ? AND session != ?', [nif, hashSessionId(current_session)]);
    }
}

export async function addAccount(nif: number, force: string): Promise<void> {
    await queryDB(force, 'INSERT INTO users (nif) VALUES (?)', nif);

    // If the user has an account in any other force with a set password, copy that password to the new account
    const userForces = await getUserForces(nif, true);
    for (const userForce of userForces) {
        if (userForce.name === force) continue; // Skip the current force

        if (userForce.password) {
            await queryDB(force, 'UPDATE users SET password = ? WHERE nif = ?', [userForce.password, nif]);
            break;
        }
    }
}

export async function clearAccountTokens(nif: number, force: string, exclude?: string): Promise<void> {
    if (exclude === undefined) {
        await queryDB(force, 'DELETE FROM sessions WHERE nif = ?', nif);
    } else {
        await queryDB(force, 'DELETE FROM sessions WHERE nif = ? AND session != ?', [nif, hashSessionId(exclude)]);
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

export async function resetAccountPassword(nif: number, force: string) {
    // Reset the password of the account
    await queryDB(force, 'UPDATE users SET password = ? WHERE nif = ?', [null, nif]);

    // Clear all tokens of the account for the force
    await clearAccountTokens(nif, force);
}