import {
    addAccount,
    addAccountToken,
    generateAccountToken,
    getAccountDetails,
    getUserForces,
    updateAccountPassword,
    userHasIntents
} from "../repository";
import {DefaultReturn} from "../../../types";
import {compare, hash} from "bcrypt";
import {PASSWORD_SALT_ROUNDS} from "../../../utils/constants";

export async function validateToken(user: number, force: string, intents: string[] | undefined): Promise<DefaultReturn<void>> {
    // Check if intents were provided
    if (intents) { // If intents were provided, check if the user has them
        let hasIntents = await userHasIntents(user, force, intents);
        if (!hasIntents) { // If the user doesn't have intents, return a 403
            return {result: false, status: 403, message: "Não tens esta permissão"};
        }
    }

    return {result: true, status: 200, message: "Operação bem sucedida"};
}

type UserAccountDetails = {
    passwordChanged: boolean,
    suspended: boolean,
    lastUsed: string,
    intents: {
        [key: string]: boolean
    }
}
export async function getUserDetails(requestingNif: number, requestedNif: number, force: string): Promise<DefaultReturn<UserAccountDetails>> {
    // Check if the requesting user is the user itself
    if (requestingNif !== requestedNif) {
        // If it's not the user itself, check if the user has the "accounts" intent
        let hasIntent = await userHasIntents(requestingNif, force, "accounts");
        if (!hasIntent) {
            return {result: false, status: 403, message: "Não tens permissão para efetuar esta ação"};
        }
    }

    let accountData = await getAccountDetails(force, requestedNif);
    if (!accountData.status) { // Status can only be false, if the account wasn't found
        return {result: false, status: 404, message: "Utilizador não encontrado"};
    }

    // Return the response
    return {
        result: true,
        status: 200,
        data: {
            passwordChanged: accountData.data!.password !== null,
            suspended: accountData.data!.suspended,
            lastUsed: accountData.data!.last_interaction.toISOString(),
            intents: accountData.data!.intents
        }
    }
}

export async function getAccountForces(requestingNif: number, nif: number): Promise<DefaultReturn<{name: string, suspended: boolean}[]>> {
    // Check if the requesting user is the user itself
    // Only the user itself can see their own forces
    if (requestingNif !== nif) {
        return {result: false, status: 403, message: "Não tens permissão para efetuar esta ação"};
    }

    // Get the forces the account belongs to
    let response = await getUserForces(nif);

    return {result: true, status: 200, data: response};
}

export async function loginUser(nif: number, password: string, persistent: boolean | undefined): Promise<DefaultReturn<{token: string, forces: string[]}>> {
    // Check if the user exists (it's needed to check on all forces databases)
    let user_forces = await getUserForces(nif, true);

    // If the user_forces array is empty, then the username doesn't exist
    if (user_forces.length === 0) {
        return {result: false, status: 404, message: "NIF ou password errados."};
    }

    let correct_password: boolean; // This variable will either hold the hashed password gotten from the request body or, incase of a default password, the cleartext password gotten from body

    // If the password is NULL, then the given password shouldn't be hashed
    if (user_forces[0].password === null) {
        correct_password = String(password) === "seguranca";
    } else {
        // If the password is not NULL, this needs to be hashed
        correct_password = await compare(password, String(user_forces[0].password));
    }

    // Now compare the passwords
    // If the password isn't correct, return 401
    if (!correct_password) {
        return {result: false, status: 401, message: "NIF ou password errados."};
    }

    // Check if the user is suspended in all forces they belong to
    let valid = false;
    for (const force of user_forces) {
        if (!force.suspended) { // If the user is not suspended in, at least, 1 force, the login is valid
            valid = true;
            break;
        }
    }

    if (!valid) { // If the user is suspended in all forces, return 403
        return {result: false, status: 403, message: "Esta conta encontra-se suspensa."};
    }

    // If everything is correct, generate a token
    const token = await generateAccountToken();

    // After generating the token, store it in the databases of all the forces the user belongs to
    for (const force of user_forces) {
        await addAccountToken(force.name, nif, token, persistent ? persistent: false);
    }

    // Return the data to the Controller
    // * The "forces" field must only include the forces the user is not suspended in
    return {result: true, status: 200, data: {token, forces: user_forces.filter((force) => !force.suspended).map((force) => force.name)}};
}

export async function changeUserPassword(nif: number, force: string, oldPassword: string, newPassword: string, confirmPassword: string, sessionToken: string): Promise<DefaultReturn<void>> {
    // * Check if the old password is correct
    // Get the password from the DB
    // ! This query will never return a "false" status since the user has to be logged in to change the password
    const accountInfo = await getAccountDetails(force, nif);

    // If the password isn't the default one, hash the password and compare it
    let isPasswordCorrect: boolean;
    if (accountInfo.data!.password === null) { // Password is the default onew
        isPasswordCorrect = "seguranca" == String(oldPassword);
    } else {
        isPasswordCorrect = await compare(String(oldPassword), String(accountInfo.data!.password));
    }

    // If the password is incorrect, return 401
    if (!isPasswordCorrect) {
        return {result: false, status: 401, message: "Password antiga incorreta"};
    }

    // Make sure the new passwords match
    if (newPassword !== confirmPassword) {
        return {result: false, status: 400, message: "As novas passwords não coincidem"};
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, PASSWORD_SALT_ROUNDS);

    // * Update the password in every force the user is in
    await updateAccountPassword(nif, hashedPassword, sessionToken);


    // Return success
    return {result: true, status: 200};
}

export async function createAccount(nif: number, force: string): Promise<DefaultReturn<void>> {
    // First, make sure this user doesn't already have an account
    const user_forces = await getUserForces(nif);
    if (user_forces.length > 0 ) {
        return {result: false, status: 400, message: "Este utilizador já tem uma conta"};
    }

    // After, make sure the officer exists in the force since there can't be accounts for non-existing officers
    // TODO this needs to be done after the repository in the officers endpoint is completed

    // Add the account in the force's DB
    await addAccount(nif, force);

    // Return success
    return {result: true, status: 200};
}