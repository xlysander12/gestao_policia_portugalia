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
import {getForcePatrolTypes, getForceStatuses} from "../../util/repository";

async function canOfficerBeInPatrol(force: string, officerNif: number, patrolStart: Date, patrolEnd: Date | null, patrolId?: string): Promise<[boolean, string]> {
    if (await isOfficerInPatrol(force, officerNif, patrolStart, patrolEnd, patrolId)) {
        return [false, "O efetivo já está em patrulha"];
    }

    // First, check if the officer exists, either in the current force or in any of the forces the current force has patrols with
    let officerData: InnerOfficerData | null = null;
    let officerForce: string = force;

    for (const patrolForce of [...getForcePatrolForces(force), force]) {
        const tempResult = await getOfficerData(officerNif, patrolForce);

        if (tempResult !== null) {
            officerData = tempResult;
            officerForce = patrolForce;
            break;
        }
    }

    // If the officer does not exist in any of the forces, return an error
    if (officerData === null) {
        return [false, "O efetivo não existe"];
    }

    // Since the officer exists, check if their status allows for patrols or not
    const officerStatus = (await getForceStatuses(officerForce)).filter(status => status.id === officerData.status)[0];
    if (!officerStatus.canPatrol) {
        return [false, "O efetivo não pode patrulhar"];
    }

    return [true, ""];
}

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
    // * Make sure that, if the patrol type requires a special unit, it is present
    // Fetch the patrol types from the force
    const patrolTypes = await getForcePatrolTypes(force);

    // Compare the patrol type with the ones from the force
    const patrolType = patrolTypes.find(type => type.id === patrolData.type);

    // If the patrol type returns undefined, return an error
    if (!patrolType) {
        return {
            result: false,
            status: 400,
            message: "Tipo de patrulha inválido"
        }
    }

    // If the patrol type requires a special unit and it is not present, return an error
    if (patrolType.isSpecial && !patrolData.special_unit) {
        return {
            result: false,
            status: 400,
            message: "Unidade especial obrigatória"
        }
    }

    // * If the current officer is not in the list of officers, add it
    if (!patrolData.officers.includes(requestingOfficer)) {
        patrolData.officers.push(requestingOfficer);
    }

    // Loop through all the officers and check if they exist and aren't in antoher patrol or inactive
    for (const officerNif of patrolData.officers) {
        const [canBeInPatrol, error] = await canOfficerBeInPatrol(force, officerNif, new Date(patrolData.start), patrolData.end ? new Date(patrolData.end): null);

        if (!canBeInPatrol) {
            return {
                result: false,
                status: 400,
                message: error
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

    // Loop through all the officers and check if they exist and aren't in antoher patrol or inactive
    if (changes.officers) {
        for (const officerNif of changes.officers) {
            const [canBeInPatrol, error] = await canOfficerBeInPatrol(force, officerNif, changes.start ? new Date(changes.start): patrolData.start, changes.end ? new Date(changes.end): patrolData.end, `${patrolData.force}${patrolData.id}`);

            if (!canBeInPatrol) {
                return {
                    result: false,
                    status: 400,
                    message: error
                }
            }
        }
    }

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