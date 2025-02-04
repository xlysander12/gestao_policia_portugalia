import {DefaultReturn} from "../../../types";
import {
    getForceInactivityTypes,
    getForceIntents,
    getForcePatents, getForcePatrolTypes,
    getForceSpecialUnits,
    getForceSpecialUnitsRoles,
    getForceStatuses
} from "../repository";
import {
    InactivityTypeData,
    IntentData,
    PatentData, PatrolTypeData,
    SpecialUnitData,
    SpecialUnitRoleData,
    StatusData
} from "@portalseguranca/api-types/util/output";
import {getForcePatrolForces} from "../../../utils/config-handler";

export async function forcePatents(force: string): Promise<DefaultReturn<PatentData[]>> {
    // Get the list from the repository
    const patents: PatentData[] = ((await getForcePatents(force))! as PatentData[]);

    // Return 200
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
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
        message: "Operação concluída com sucesso",
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
        message: "Operação concluída com sucesso",
        data: {units: units, roles: roles}
    }
}

export async function forceIntents(force: string): Promise<DefaultReturn<IntentData[]>> {
    // Get the list of special intents from the repository
    const intents = await getForceIntents(force);


    // Return 200
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: intents
    }
}

export async function forceInactivityTypes(force: string): Promise<DefaultReturn<InactivityTypeData[]>> {
    // Get the list of inactivity types from the repository
    const types = await getForceInactivityTypes(force);

    // Return 200
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: types
    }
}

export async function forcePatrolTypes(force: string): Promise<DefaultReturn<PatrolTypeData[]>> {
    // Get the list of patrol types from the repository
    const types = await getForcePatrolTypes(force);

    // Return 200
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: types
    }
}

export async function forcePatrolForces(force: string): Promise<DefaultReturn<string[]>> {
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: getForcePatrolForces(force)
    }
}