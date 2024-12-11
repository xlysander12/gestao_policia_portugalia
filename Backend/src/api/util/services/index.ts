import {DefaultReturn} from "../../../types";
import {getForcePatents, getForceSpecialUnits, getForceSpecialUnitsRoles, getForceStatuses} from "../repository";
import {PatentData, SpecialUnitData, SpecialUnitRoleData, StatusData} from "@portalseguranca/api-types/util/schema";

export async function forcePatents(force: string): Promise<DefaultReturn<PatentData[]>> {
    // Get the list from the repository
    const patents = await getForcePatents(force);

    // Return 200
    return {
        result: true,
        status: 200,
        data: patents
    }
}

export async function forceStatuses(force: string): Promise<DefaultReturn<StatusData[]>> {
    // Get the list from the repository
    const statuses = await getForceStatuses(force);

    // Return 200
    return {
        result: true,
        status: 200,
        data: statuses
    }
}

export async function forceSpecialUnits(force: string): Promise<DefaultReturn<{units: SpecialUnitData[], roles: SpecialUnitRoleData[]}>> {
    // Get the list of special units from the repository
    const units = await getForceSpecialUnits(force);

    // Get the list of roles for the special units from the repository
    const roles = await getForceSpecialUnitsRoles(force);

    // Return 200
    return {
        result: true,
        status: 200,
        data: {units: units, roles: roles}
    }
}