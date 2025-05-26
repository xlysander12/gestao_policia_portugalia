import {DefaultReturn, InnerOfficerData} from "../../../types";
import {
    getEvaluationDecisions,
    getEvaluationFields,
    getEvaluationGrades, getEventTypes,
    getForceInactivityTypes,
    getForceIntents,
    getForcePatents,
    getForcePatrolTypes,
    getForceSpecialUnits,
    getForceSpecialUnitsRoles,
    getForceStatuses,
    getLastCeremony,
    getPendingInactivityJustifications,
    getSpecialUnitActiveMembers,
    getUserErrors,
    updateLastCeremony
} from "../repository";
import {
    InactivityTypeData,
    IntentData, BaseNotification,
    PatentData, PatrolTypeData,
    SpecialUnitData,
    SpecialUnitRoleData,
    StatusData, ActivityNotification, EvaluationGrade, EvaluationField, EvaluationDecision, EventType, EventNotification
} from "@portalseguranca/api-types/util/output";
import {getForcePatrolForces} from "../../../utils/config-handler";
import {getAccountDetails, userHasIntents} from "../../accounts/repository";
import {dateToUnix, unixToDate} from "../../../utils/date-handler";
import {MinifiedOfficerData, OfficerUnit} from "@portalseguranca/api-types/officers/output";
import {getOfficerPatrol} from "../../patrols/repository";
import {getEvent, getEvents} from "../../events/repository";
import {getOfficerData} from "../../officers/repository";

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

export async function forceSpecialUnitsActiveMembers(force: string, unit_id: number): Promise<DefaultReturn<MinifiedOfficerData[]>> {
    // First, make sure the requested Special Unit exists
    const unit = (await getForceSpecialUnits(force)).find(u => u.id === unit_id);

    if (!unit) {
        return {
            result: false,
            status: 404,
            message: "Unidade Especial Inexistente"
        }
    }

    // Fetch all members of the requested Special Unit
    const officers = await getSpecialUnitActiveMembers(force, unit.id);

    // Loop through every member and check if they are in a patrol
    // If they are, consider them "active"
    const active: InnerOfficerData[] = [];
    for (const officer of officers) {
        // Fetch current officcer patrol
        const patrol = await getOfficerPatrol(force, officer.nif);

        if (!patrol) continue;

        active.push(officer);
    }

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: active.map(entry => {
            return {
                name: entry.name,
                patent: entry.patent,
                callsign: entry.callsign,
                status: entry.status,
                nif: entry.nif
            }
        })
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

export async function eventTypes(force: string): Promise<DefaultReturn<EventType[]>> {
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: await getEventTypes(force)
    }
}

export async function lastCeremony(force: string): Promise<DefaultReturn<Date>> {
    // Get the last ceremony from the repository
    const lastCeremony = await getLastCeremony(force);

    if (!lastCeremony) {
        return {
            result: false,
            status: 404,
            message: "Não existe nenhuma data da última cerimónia registada",
        }
    }

    // Return 200
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: lastCeremony
    }
}

export async function changeLastCeremony(force: string, timestamp: number): Promise<DefaultReturn<void>> {
    // Change the last ceremony date in the repository
    await updateLastCeremony(force, unixToDate(timestamp));

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
    }
}

export async function notifications(force: string, nif: number): Promise<DefaultReturn<BaseNotification[]>> {
    // Initialize list of Notifications
    const notifications: BaseNotification[] = []

    // * If the user has the "activity" intent, search for pending justifications
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

    // * Check for possible events where the user might have been assignated
    const currentDate = new Date();

    // * Fetch all events and then filter them
    // For, reasons, fetch all events whoose start date is 7 days before the current one
    const events = (await getEvents(force, dateToUnix(currentDate) - (7 * 24 * 60 * 60))).filter(event => {
        // Only return events that haven't ended yet and start in 1 hour or less or are already started
        return dateToUnix(event.end) >= dateToUnix(currentDate) && dateToUnix(event.start) - dateToUnix(currentDate) <= (60 * 60);
    });

    // Loop through all events and check if the user should receive their notification
    for (const event of events) {
        // Get the full type of the event
        const full_event = (await getEvent(force, event.id, event.force))!;

        // Get full event type
        const event_type = (await getEventTypes(event.force)).find(event_type => event_type.id === full_event.type)!;

        // Get the notification object react
        const notification_object: EventNotification = {
            type: "event",
            timestamp: dateToUnix(full_event.start),
            url: `/e/${full_event.force}${full_event.id}`,
            title: full_event.title
        }

        // If the variant of the event is "ceremony" the user should receive the notification
        if (event_type.variant === "ceremony") {
            notifications.push(notification_object);
            continue;
        }

        // If the variant of the event is "special_unit", check if the logged user is a part of that special unit
        if (event_type.variant === "special_unit" && full_event.special_unit !== null) {
            // Get all special units of the logged user
            const units: OfficerUnit[] = (await getOfficerData(nif, force))?.special_units ?? [];

            // If the officer is a part of the unit in the event, they should receive the notification
            if (units.some(unit => unit.id === full_event.special_unit)) {
                notifications.push(notification_object);
                continue;
            }
        }

        // If the variant of the event is "custom", check if the logged user is assigned to it
        if (event_type.variant === "custom") {
            if (full_event.assignees.some(assignee => assignee === nif)) {
                notifications.push(notification_object);
            }
        }
    }


    // * Check if the current logged user is using the default password
    const accountData = (await getAccountDetails(nif, force))!;
    if (accountData.password === null) {
        // If the user is using the default password, add a notification
        notifications.push({
            type: "password",
            timestamp: dateToUnix(new Date()),
            url: `/`
        });
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