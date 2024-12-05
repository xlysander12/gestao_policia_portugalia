import {DefaultReturn, InnerOfficerData} from "../../../types";
import {routeMethodType} from "../../routes";
import {
    addOfficer,
    fireOfficer,
    getNextAvaliableCallsign,
    getOfficerData,
    getOfficersList,
    updateOfficer
} from "../repository";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";
import {getForceDefaultPatents, getForcePromotionExpression} from "../../../utils/config-handler";
import {UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {getForcePatents} from "../../util/repository";

export async function listOfficers(force: string, routeDetails: routeMethodType, filters: {name: string, value: any}[]): Promise<DefaultReturn<MinifiedOfficerData[]>> {

    // Fetch the list from the database
    let officerList = await getOfficersList(force, routeDetails, filters);

    // Return the list
    return {result: true, status: 200, data: officerList};
}

// TODO: This service should check if the provided nif is a former Officer, and if so, ask if the user wants to import their old data.
export async function hireOfficer(name: string, phone: number, iban: string, nif: number, kms: number, discord: number, steam: string,
                                  recruit: boolean,
                                  force: string, restore?: boolean | undefined): Promise<DefaultReturn<void>> { // TODO: There must be a way to manually set the entry date

    // Making sure the provided nif doesn't already exist as an active officer
    let officer_exists_check_result = await getOfficerData(nif, force);
    if (officer_exists_check_result !== null) {
        return {result: false, status: 409, message: "Já existe um efetivo com esse NIF."};
    }

    // Making sure the provided nif doesn't already exist as a former officer
    // If it does, return 100 to ask if the user wants to import the old data
    let former_officer_exists_check_result = await getOfficerData(nif, force, false, true);
    if (former_officer_exists_check_result !== null) {
        return {result: false, status: 100, message: "Este Nif é pertencente a um antigo efetivo. Desejas importar os dados antigos?"};
    }

    // Checking if the patent will be a recruit or not
    let patent = recruit ? getForceDefaultPatents(force).recruit: getForceDefaultPatents(force).default;

    // * Calculating what the new callsign will be, if it's not a recruit
    // Get the leading char of the patent of the new officer
    let leading_char = (await getForcePatents(force, patent))[0].leading_char;

    let callsign = null
    if (patent === 0) {
        callsign = await getNextAvaliableCallsign(leading_char, force);
    }

    // Inserting the new officer into the database
    await addOfficer(name, patent, callsign, phone, nif, iban, kms, discord, steam, force);

    // If everything went according to plan, return a 200 status code
    return {result: true, status: 201};
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
    return {result: true, status: 200};
}

export async function deleteOfficer(force: string, targetOfficer: InnerOfficerData, loggedOfficer: InnerOfficerData, reason?: string): Promise<DefaultReturn<void>> {
    // Making sure the requesting user is higher patent the requested officer
    if (targetOfficer.patent >= loggedOfficer.patent) {
        return {result: false, status: 403, message: "Não tens permissão para despedir este efetivo."};
    }

    // TODO: This must not actually delete the officer from the database.
    //  instead change a "fired" column that will be used to filter out the officers that are no longer active.

    // After making sure the officer can be fired, run the SQL procedure to transfer the data to the archive db
    await fireOfficer(targetOfficer.nif, force, reason);

    // If everything went according to plan, return a 200 status code
    return {result: true, status: 200};
}