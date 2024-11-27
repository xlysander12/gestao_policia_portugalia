import {queryDB} from "../../../utils/db-connector";
import {userHasIntents} from "../../../utils/user-handler";

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