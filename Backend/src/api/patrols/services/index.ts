import {DefaultReturn, InnerOfficerData} from "../../../types";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {createPatrol, deletePatrol, editPatrol, isOfficerInPatrol, listPatrols} from "../repository";
import {CreatePatrolBody, EditPatrolBody} from "@portalseguranca/api-types/patrols/input";
import {getOfficerData} from "../../officers/repository";
import {getForcePatrolForces} from "../../../utils/config-handler";
import {InnerPatrolData} from "../../../types/inner-types";
import {userHasIntents} from "../../accounts/repository";

export async function patrolsHistory(force: string, validFilters: RouteFilterType, receivedFilters: ReceivedQueryParams, page: number = 1, entriesPerPage: number = 10): Promise<DefaultReturn<{
    patrols: MinifiedPatrolData[],
    pages: number
}>> {
    // Fetch the patrols from the repository
    const result = await listPatrols(force, validFilters, receivedFilters, page, entriesPerPage);

    // Return the list
    return {
        result: true,
        status: 200,
        message: "Operação efetuada com sucesso",
        data: result
    }
}

export async function patrolCreate(force: string, patrolData: CreatePatrolBody, requestingOfficer: number): Promise<DefaultReturn<void>> {
    // * If the current officer is not in the list of officers, add it
    if (!patrolData.officers.includes(requestingOfficer)) {
        patrolData.officers.push(requestingOfficer);
    }

    // Loop through all the officers and check if they exist and aren't in antoher patrol
    for (const officerNif of patrolData.officers) {
        if (await isOfficerInPatrol(force, officerNif)) {
            return {
                result: false,
                status: 400,
                message: "Um ou mais efetivos já estão em patrulha"
            }
        }

        // First, check in the request's force's database
        const result = await getOfficerData(officerNif, force);

        // If the officer does exist, continue to the next one on the array
        if (result !== null) {
            continue;
        }

        // Then, check if the officer exists in all of the other forces the current force has patrols with
        for (const patrolForce of getForcePatrolForces(force)) {
            const result = await getOfficerData(officerNif, patrolForce);

            if (result !== null) {
                continue;
            }

            // If the officer does not exist in any of the forces, return an error
            return {
                result: false,
                status: 400,
                message: "Um ou mais efetivos não existem"
            }
        }
    }

    // Since all officers exist, create the patrol
    await createPatrol(force, patrolData.type, patrolData.special_unit || null, patrolData.officers, patrolData.start, patrolData.end || null, patrolData.notes || null);

    // If everything went well, return success
    return {
        result: true,
        status: 201,
        message: "Patrulha criada com sucesso"
    }
}

export async function patrolEdit(force: string, userData: InnerOfficerData, patrolData: InnerPatrolData, changes: EditPatrolBody): Promise<DefaultReturn<void>> {
    // First of all, check if the user is in said patrol or if they have the "patrols" intent
    const userHasIntentsResult = await userHasIntents(userData.nif, force, "patrols");

    if (!userHasIntentsResult && !patrolData.officers.includes(userData.nif)) {
        return {
            result: false,
            status: 403,
            message: "Não tem permissões para editar esta patrulha"
        }
    }

    // First, if the patrol has already ended for longer than 30 minutes and the user doesn't have the "patrols" intent, return an error
    if (patrolData.end && (Date.now() - patrolData.end.getTime() > (30 * 60 * 1000)) && !(userHasIntentsResult)) {
        return {
            result: false,
            status: 400,
            message: "Não podes editar uma patrulha que já terminou há mais de 30 minutos"
        }
    }

    // * If the above doesn't apply, the patrol is editable
    // Call the repository to edit the patrol
    await editPatrol(patrolData.force, patrolData.id, changes);

    return {
        result: true,
        status: 200,
        message: "Patrulha editada com sucesso"
    }
}

export async function patrolDelete(force: string, id: number) {
    // Call the repository to delete the patrol
    await deletePatrol(force, id);

    return {
        result: true,
        status: 200,
        message: "Patrulha eliminada com sucesso"
    }
}