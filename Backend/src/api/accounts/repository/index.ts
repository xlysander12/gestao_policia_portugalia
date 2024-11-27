import {queryDB} from "../../../utils/db-connector";
import {getForcesList} from "../../../utils/config-handler";

// TODO: Return type should be a proper object
export async function isTokenValid(token: string, force: any) {
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

export async function userHasIntents(nif: number, force: any, intent: string | string[]) {
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

type AccountDetailsDB = {
    nif: number,
    password: string,
    suspended: boolean,
    last_interaction: Date,
    intents: {
        [key: string]: boolean
    }
}
export async function getAccountDetails(force: string, nif: number): Promise<{status: boolean, data?: AccountDetailsDB}> {
    // Fetch all the data related to the account from the database
    const result = await queryDB(force, 'SELECT * FROM users WHERE nif = ? LIMIT 1', nif);

    // If no user exists, return 404
    if (result.length === 0) {
        return {status: false};
    }

    // Build the return object
    let details: AccountDetailsDB = {
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
    return {status: true, data: details};
}