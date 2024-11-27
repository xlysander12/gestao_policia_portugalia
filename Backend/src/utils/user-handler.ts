import {queryDB} from "./db-connector";
import {getForcesList} from "./config-handler";

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