import {DefaultReturn, InnerOfficerData} from "../../../types";
import {RouteFilterType} from "../../routes";
import {
    addOfficer, eraseOfficer,
    fireOfficer,
    getNextAvailableCallsign,
    getOfficersList, reHireOfficer,
    updateOfficer
} from "../repository";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";
import {getForceDefaultPatents, getForcePromotionExpression} from "../../../utils/config-handler";
import {UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {getForcePatents} from "../../util/repository";
import {ReceivedQueryParams} from "../../../utils/filters";

export async function listOfficers(force: string, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams): Promise<DefaultReturn<MinifiedOfficerData[]>> {

    // Fetch the list from the database
    let officerList = await getOfficersList(force, routeValidFilters, filters);

    // Return the list
    return {result: true, status: 200, message: "Operação concluida com sucesso", data: officerList};
}

export async function hireOfficer(name: string, phone: number, iban: string, nif: number, kms: number, discord: number, steam: string,
                                  recruit: boolean,
                                  force: string, targetOfficer: InnerOfficerData | null, isTargetOfficerFormer: boolean, overwrite: boolean): Promise<DefaultReturn<void>> { // TODO: There must be a way to manually set the entry date

    // First, check if the nif is already in use, either by an active or former officer
    if (targetOfficer !== null) {
        // Then check if it is an active officer
        if (!isTargetOfficerFormer) {
            // If it is, return a 409 status code
            return {result: false, status: 409, message: "Já existe um efetivo com esse NIF."};
        }

        // Since it's not an active officer, make sure the "overwrite" query param is present or false
        // If it's not present, or its value is false, return a 409 status code
        if (!overwrite) {
            return {result: false, status: 409, message: "Já existe um antigo efetivo com esse NIF."};
        }
    }

    // * Since this request is now validated, we can proceed to add the new officer
    // Delete all previous data of the officer
    if (targetOfficer !== null) {
        await eraseOfficer(nif, force);
    }

    // Checking if the patent will be a recruit or not
    let patent = recruit ? getForceDefaultPatents(force).recruit: getForceDefaultPatents(force).default;

    // * Calculating what the new callsign will be, if it's not a recruit
    let callsign = null
    if (patent === getForceDefaultPatents(force).default) {
        // Get the leading char of the patent of the new officer
        let leading_char = (await getForcePatents(force, patent))[0].leading_char;

        callsign = await getNextAvailableCallsign(leading_char, force);
    }

    // Inserting the new officer into the database
    await addOfficer(name, patent, callsign, phone, nif, iban, kms, discord, steam, force);

    // If everything went according to plan, return a 200 status code
    return {result: true, status: 201, message: "Efetivo contratado com sucesso."};
}

export async function restoreOfficer(officer: InnerOfficerData, force: string): Promise<DefaultReturn<void>> {
    // Make sure this officer is, indeed, a former officer
    if (!officer.isFormer) {
        return {result: false, status: 409, message: "Este efetivo já é ativo na força."};
    }

    // Call the repository to restore the officer
    await reHireOfficer(officer.nif, force);

    // After all is complete, return a 200 status code
    return {result: true, status: 200, message: "Efetivo restaurado com sucesso."};
}

export async function alterOfficer(nif: number, force: string, currentInfo: InnerOfficerData, changes: UpdateOfficerRequestBody, loggedOfficer: InnerOfficerData): Promise<DefaultReturn<void>> {
    const validFields = ["name", "patent", "callsign", "status", "entry_date", "phone", "iban", "kms", "discord", "steam"];

    // * Figure out if this change is considered a promotion
    // Get the expression from the config file
    let isPromotionExpression: string = getForcePromotionExpression(force);

    // Alter all possible variables in the expression string
    for (const field of validFields) {
        // @ts-ignore
        isPromotionExpression = isPromotionExpression.replaceAll(`$old${field}`, currentInfo[field]);
        // @ts-ignore
        isPromotionExpression = isPromotionExpression.replaceAll(`$new${field}`, changes[field] !== undefined ? changes[field] : currentInfo[field]);
    }

    // * An User cannot alter the information about an Officer with higher patent than them
    if (currentInfo.patent >= loggedOfficer.patent) {
        return {result: false, status: 403, message: "Não tens permissão para alterar este efetivo."};
    }

    // Evaluate the expression
    let isPromotion = eval(isPromotionExpression);

    // Call the repository to update the Officer
    await updateOfficer(nif, force, changes, isPromotion);

    // After all is complete, return a 200 status code
    return {result: true, status: 200, message: "Efetivo editado com sucesso."};
}

export async function deleteOfficer(force: string, targetOfficer: InnerOfficerData, loggedOfficer: InnerOfficerData, reason?: string): Promise<DefaultReturn<void>> {
    // Making sure the requesting user is higher patent the requested officer
    if (targetOfficer.patent >= loggedOfficer.patent) {
        return {result: false, status: 403, message: "Não tens permissão para despedir este efetivo."};
    }

    // After making sure the officer can be fired, run the SQL procedure to transfer the data to the archive db
    await fireOfficer(targetOfficer.nif, force, reason);

    // If everything went according to plan, return a 200 status code
    return {result: true, status: 200, message: "Efetivo despedido com sucesso."};
}