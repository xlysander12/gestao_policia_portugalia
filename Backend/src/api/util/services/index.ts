import {DefaultReturn} from "../../../types";
import {
    getEvaluationDecisions,
    getEvaluationFields,
    getEvaluationGrades,
    getForceInactivityTypes,
    getForceIntents,
    getForcePatents, getForcePatrolTypes,
    getForceSpecialUnits,
    getForceSpecialUnitsRoles,
    getForceStatuses, getPendingInactivityJustifications, getUserErrors
} from "../repository";
import {
    InactivityTypeData,
    IntentData, BaseNotification,
    PatentData, PatrolTypeData,
    SpecialUnitData,
    SpecialUnitRoleData,
    StatusData, ActivityNotification, EvaluationGrade, EvaluationField, EvaluationDecision
} from "@portalseguranca/api-types/util/output";
import {getForcePatrolForces} from "../../../utils/config-handler";
import {userHasIntents} from "../../accounts/repository";

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

export function forcePatrolForces(force: string): DefaultReturn<string[]> {
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: getForcePatrolForces(force)
    }
}

export async function evaluationGrades(force: string): Promise<DefaultReturn<EvaluationGrade[]>> {
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: await getEvaluationGrades(force)
    }
}

export async function evaluationFields(force: string): Promise<DefaultReturn<EvaluationField[]>> {
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: await getEvaluationFields(force)
    }
}

export async function evaluationDecisions(force: string): Promise<DefaultReturn<EvaluationDecision[]>> {
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: await getEvaluationDecisions(force)
    }
}

export async function notifications(force: string, nif: number): Promise<DefaultReturn<BaseNotification[]>> {
    // Initialize list of Notifications
    const notifications: BaseNotification[] = []

    // If the user has the "activity" intent, search for pending justifications
    if (await userHasIntents(nif, force, "activity")) {
        // Search for pending justifications
        const pending = await getPendingInactivityJustifications(force);

        for (const justification of pending) {
            // Getting the type of the justification in string
            const stringifiedType = (await getForceInactivityTypes(force)).find(type => type.id === justification.type)?.name;
            if (!stringifiedType) continue;

            const notification: ActivityNotification = {
                type: "activity",
                justificationType: justification.type,
                timestamp: justification.timestamp.getTime(),
                url: `/atividade/${justification.nif}/j/${justification.id}`,
                officer: justification.nif
            }

            notifications.push(notification);
        }
    }

    // * After all possible notifications have been checking, return them
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: notifications
    }
}

export async function errors(force: string, nif: number): Promise<DefaultReturn<{code: string, timestamp: Date}[]>> {
    // Get the list from the database
    const errors = await getUserErrors(force, nif);

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: errors
    }
}