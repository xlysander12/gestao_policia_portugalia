import {
    addAccount,
    addAccountToken, changeAccountIntent, changeAccountSuspendedStatus, deleteAccount, deleteAccountToken,
    generateAccountToken,
    getAccountDetails,
    getUserForces, resetAccountPassword,
    updateAccountPassword,
    userHasIntents
} from "../repository";
import {DefaultReturn} from "../../../types";
import {compare, hash} from "bcrypt";
import {PASSWORD_SALT_ROUNDS} from "../../../utils/constants";
import {InnerAccountData} from "../../../types/inner-types";
import {getOfficerData} from "../../officers/repository";
import { AccountInfo } from "@portalseguranca/api-types/account/output";
import {dateToUnix} from "../../../utils/date-handler";

export async function validateToken(user: number, force: string, intents: string[] | undefined): Promise<DefaultReturn<void>> {
    // Check if intents were provided
    if (intents) { // If intents were provided, check if the user has them
        const hasIntents = await userHasIntents(user, force, intents);
        if (!hasIntents) { // If the user doesn't have intents, return a 403
            return {result: false, status: 403, message: "Não tens esta permissão"};
        }
    }

    return {result: true, status: 200, message: "Operação bem sucedida"};
}

export async function getUserDetails(requestingNif: number, requestedAccount: InnerAccountData, force: string): Promise<DefaultReturn<AccountInfo>> {
    // Check if the requesting user is the user itself
    if (requestingNif !== requestedAccount.nif) {
        // If it's not the user itself, check if the user has the "accounts" intent
        const hasIntent = await userHasIntents(requestingNif, force, "accounts");
        if (!hasIntent) {
            return {result: false, status: 403, message: "Não tens permissão para efetuar esta ação"};
        }
    }

    // Return the response
    return {
        result: true,
        status: 200,
        message: "Operação bem sucedida",
        data: {
            defaultPassword: requestedAccount.password === null,
            suspended: requestedAccount.suspended,
            lastUsed: requestedAccount.last_interaction ? dateToUnix(requestedAccount.last_interaction): null,
            intents: requestedAccount.intents
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
    const response = await getUserForces(nif);

    return {result: true, status: 200, message: "Operação bem sucedida", data: response};
}

export async function loginUser(nif: number, password: string, persistent: boolean | undefined): Promise<DefaultReturn<{token: string, forces: string[]}>> {
    // Check if the user exists (it's needed to check on all forces databases)
    const user_forces = await getUserForces(nif, true);

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
        await addAccountToken(force.name, nif, token, persistent ?? false);
    }

    // Return the data to the Controller
    // * The "forces" field must only include the forces the user is not suspended in
    return {result: true, status: 200, message: "Operação bem sucedida", data: {token, forces: user_forces.filter((force) => !force.suspended).map((force) => force.name)}};
}

export async function logoutUser(nif: number, token: string): Promise<DefaultReturn<void>> {
    // Get all the forces the user belongs to
    const forces = await getUserForces(nif);

    // Delete the token from all forces
    for (const force of forces) {
        await deleteAccountToken(force.name, nif, token);
    }

    // Return success
    return {result: true, status: 200, message: "Sessão terminada!"};
}

export async function changeUserPassword(nif: number, force: string, oldPassword: string, newPassword: string, confirmPassword: string, sessionToken: string): Promise<DefaultReturn<void>> {
    // * Check if the old password is correct
    // Get the password from the DB
    // ! This query will never return a "false" status since the user has to be logged in to change the password
    const accountInfo = await getAccountDetails(nif, force);

    // If the password isn't the default one, hash the password and compare it
    let isPasswordCorrect: boolean;
    if (accountInfo!.password === null) { // Password is the default onew
        isPasswordCorrect = "seguranca" == String(oldPassword);
    } else {
        isPasswordCorrect = await compare(String(oldPassword), String(accountInfo!.password));
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
    return {result: true, status: 200, message: "Password alterada com sucesso"};
}

export async function createAccount(nif: number, force: string): Promise<DefaultReturn<void>> {
    // First, make sure this user doesn't already have an account in this force
    const accountDetails = await getAccountDetails(nif, force);
    if (accountDetails !== null) {
        return {result: false, status: 400, message: "Este utilizador já tem uma conta nesta força"};
    }

    // After, make sure the officer exists in the force since there can't be accounts for non-existing officers
    const officerDetails = await getOfficerData(nif, force, false, false);
    if (!officerDetails) {
        return {result: false, status: 404, message: "Este efetivo não existe nesta força"};
    }

    // Add the account in the force's DB
    await addAccount(nif, force);

    // Return success
    return {result: true, status: 200, message: "Conta criada com sucesso"};
}

export async function changeUserPermissions(nif: number, force: string, requestingUser: number, intents: Record<string, boolean>): Promise<DefaultReturn<void>> {
    // Get the intents names
    const intentsNames = Object.keys(intents);

    // Update intents in the database
    for (const intent of intentsNames) {
        // Make sure the requesting user has the intent it wants to update and the intent to alter accounts
        if (!(await userHasIntents(requestingUser, force, intent)) || !(await userHasIntents(requestingUser, force, "accounts"))) {
            return {result: false, status: 403, message: "Não tens permissão para efetuar esta ação"};
        }

        // Call the repository to update the intent
        await changeAccountIntent(nif, force, intent, intents[intent]);
    }

    // Return success
    return {result: true, status: 200, message: "Permissões alteradas com sucesso"};
}

export async function changeUserSuspendedStatus(nif: number, force: string, suspended: boolean): Promise<DefaultReturn<void>> {
    // Update the suspended status in the database
    await changeAccountSuspendedStatus(nif, force, suspended);

    // Return success
    return {result: true, status: 200, message: "Estado de suspensão alterado com sucesso"};
}

export async function deleteUser(nif: number, force: string): Promise<DefaultReturn<void>> {
    // Call the repository to delete the user
    await deleteAccount(nif, force);

    return {result: true, status: 200, message: "Conta eliminada com sucesso"};
}

export async function resetUserPassword(targetUser: InnerAccountData): Promise<DefaultReturn<void>> {
    // Since the user exists, confirm that it doesn't already use the default password
    if (targetUser.password === null) {
        return {result: false, status: 400, message: "Este utilizador já tem a password padrão"};
    }

    // Since the user exists and it has a custom password, reset it for every force it's in and clear all tokens
    for (const force of await getUserForces(targetUser.nif)) {
        await resetAccountPassword(targetUser.nif, force.name);
    }

    // Return success
    return {result: true, status: 200, message: "Password resetada com sucesso"};
}