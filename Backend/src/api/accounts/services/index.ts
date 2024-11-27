import {userHasIntents} from "../../../utils/user-handler";
import {getAccountDetails} from "../repository";

export async function validateToken(user: number, force: string, intents: string[] | undefined): Promise<{result: boolean, status: number, message: string}> {
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
export async function getUserDetails(requestingNif: number, requestedNif: number, force: string): Promise<{result: boolean, status: number, message?: string, data?: UserAccountDetails}> {
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