import {DefaultReturn} from "../../../types";
import {routeMethodType} from "../../routes";
import {getOfficersList} from "../repository";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";

export async function listOfficers(force: string, routeDetails: routeMethodType, filters: {name: string, value: any}[]): Promise<DefaultReturn<MinifiedOfficerData[]>> {

    // Fetch the list from the database
    let officerList = await getOfficersList(force, routeDetails, filters);

    // Return the list
    return {result: true, status: 200, data: officerList};
}