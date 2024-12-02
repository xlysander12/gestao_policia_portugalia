import {DefaultReturn} from "../../../types";
import {routeMethodType} from "../../routes";
import {addOfficer, getNextAvaliableCallsign, getOfficerData, getOfficersList} from "../repository";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";

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