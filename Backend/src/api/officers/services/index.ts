import {DefaultReturn, InnerOfficerData} from "../../../types";
import {routeMethodType} from "../../routes";
import {addOfficer, getNextAvaliableCallsign, getOfficerData, getOfficersList, updateOfficer} from "../repository";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";
import {getForcePromotionExpression} from "../../../utils/config-handler";
import {UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";

export async function listOfficers(force: string, routeDetails: routeMethodType, filters: {name: string, value: any}[]): Promise<DefaultReturn<MinifiedOfficerData[]>> {

    // Fetch the list from the database
    let officerList = await getOfficersList(force, routeDetails, filters);

    // Return the list
    return {result: true, status: 200, data: officerList};
}

// TODO: This service should check if the provided nif is a former Officer, and if so, ask if the user wants to import their old data.
export async function hireOfficer(name: string, phone: number, iban: string, nif: number, kms: number, discord: number, steam: string,
                                  recruit: boolean,
                                  force: string): Promise<DefaultReturn<void>> { // TODO: There must be a way to manually set the entry date
    // Making sure the provided nif doesn't already exist
    let officer_exists_check_result = await getOfficerData(nif, force);
    if (officer_exists_check_result !== null) {
        return {result: false, status: 409, message: "Já existe um efetivo com esse NIF."};
    }

    // Checking if the patent will be a recruit or not
    let patent = recruit ? -1: 0;

    // Calculating what the new callsign will be, if it's not a recruit
    let callsign = null
    if (patent === 0) {
        callsign = await getNextAvaliableCallsign("A", force); // TODO: This only works for the PSP force. This needs to be changed when other forces are added.
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