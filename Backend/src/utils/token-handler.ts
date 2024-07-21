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

export async function checkTokenValidityIntents(token: string | undefined, force: ForceType, intent?: string): Promise<[boolean, number, string]> {
    // Check if the token is present
    if (token === undefined || token === null) {
        return [false, 401, "Não foi fornecido um token de autenticação."];
    }

    // Making sure force is specified
    if (force === undefined) {
        return [false, 400, "Não foi fornecida uma força para a validação do token."];
    }

    // Querying the Database to check if the token exists
    const nif_result = await queryDB(force, 'SELECT nif FROM tokens WHERE token = ?', token);
    if (nif_result.length === 0) {
        return [false, 401, "O token fornecido não é válido."];
    }

    // Store the nif the token points to
    let nif = nif_result[0].nif;

    // Once it has been confirmed the token exists, the lastUsed field should be updated in all databases
    // It's used the `then()` method to avoid waiting for the query to finish since the result is not needed
    for (const forcesKey of FORCES) {
        queryDB(forcesKey, 'UPDATE tokens SET last_used = CURRENT_TIMESTAMP WHERE token = ?', token).then(_ => {});
    }

    // If intent is null, then the user doesn't need special permissions
    if (intent === null || intent === undefined) {
        return [true, 0, nif]; // Since the return was true, no HTTT Status Code is needed
    }

    // Fetch from the database the intents json of the user
    const intents_result = await queryDB(force, 'SELECT intents FROM users WHERE nif = ?', nif);

    // Converting the value to a JSON object
    let userIntents = JSON.parse(intents_result[0].intents);


    // Check if the user has the intent
    if (!userIntents[intent]) {
        return [false, 403, "Não tens permissão para realizar esta ação"];
    }

    return [true, 200, nif];
}

export async function checkTokenValidityIntentsHeaders(headers: any, intent?: string) {
    return await checkTokenValidityIntents(headers.authorization, headers["x-portalseguranca-force"], intent);
}