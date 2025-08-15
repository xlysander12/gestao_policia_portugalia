import {DefaultReturn, InnerOfficerData} from "../../../types";
import {MinifiedPatrolData} from "@portalseguranca/api-types/patrols/output";
import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {createPatrol, deletePatrol, editPatrol, isOfficerInPatrol, listPatrols} from "../repository";
import {CreatePatrolBody, EditPatrolBody} from "@portalseguranca/api-types/patrols/input";
import {getOfficerData} from "../../officers/repository";
import {getForcePatrolForces} from "../../../utils/config-handler";
import {InnerPatrolData} from "../../../types/inner-types";
import {getForcePatrolTypes, getForceStatuses} from "../../util/repository";
import {sortOfficers} from "../../officers/services";
import {dateToUnix, unixToDate} from "../../../utils/date-handler";
import {couldOfficerPatrolDueToJustificationInDate} from "../../officers/subroutes/activity/justifications/repository";

export async function sortPatrolOfficers(force: string, officers: number[]) {
    // Get the details of all officers of the patrol
    const officersData = await Promise.all(officers.map(async officerNif => {
        let officerData: InnerOfficerData | null= null;

        // Loop through all forces to get the officer data
        for (const patrolForce of [force, ...getForcePatrolForces(force)]) {
            const tempResult = await getOfficerData(officerNif, patrolForce, false, false) ??
                await getOfficerData(officerNif, patrolForce, true, false);

            if (tempResult !== null) {
                officerData = tempResult;
                break;
            }
        }

        return officerData!;
    }));

    // Sort officers
    const sortedOfficers = sortOfficers(officersData);

    // Replace the officers in the patrol with the sorted ones
    return sortedOfficers.map(officer => officer.nif);
}

async function canOfficerBeInPatrol(force: string, officerNif: number, patrolStart: Date, patrolEnd: Date | null, patrolId?: string): Promise<[boolean, string]> {
    if (await isOfficerInPatrol(force, officerNif, patrolStart, patrolEnd, patrolId)) {
        return [false, `O efetivo de NIF ${officerNif} já está em patrulha`];
    }

    // First, check if the officer exists, either in the current force or in any of the forces the current force has patrols with
    let officerData: InnerOfficerData | null = null;
    let officerForce: string = force;

    for (const patrolForce of [force, ...getForcePatrolForces(force)]) {
        const tempResult = await getOfficerData(officerNif, patrolForce, false, true);

        if (tempResult !== null) {
            officerData = tempResult;
            officerForce = patrolForce;
            break;
        }
    }

    // If the officer does not exist in any of the forces, return an error
    if (officerData === null) {
        return [false, `O efetivo de NIF ${officerNif} não existe`];
    }

    // Fetch the current's officer status
    const officerStatus = (await getForceStatuses(officerForce)).find(status => status.id === officerData.status)!;

    // Since the officer exists, check if they are / were inactive on the start of the patrol
    if (await couldOfficerPatrolDueToJustificationInDate(force, officerNif, patrolStart)) {
        return [false, `O efetivo de NIF ${officerNif} está inativo`];
    }

    // Check if the status of the officer prevents patrols (Inactivity only appears here if forcefully set)
    if (!officerStatus.canPatrol) {
        return [false, `O efetivo de NIF ${officerNif} não pode patrulhar`];
    }

    return [true, ""];
}

export async function patrolsHistory(force: string, validFilters: RouteFilterType, receivedFilters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<DefaultReturn<{
    patrols: MinifiedPatrolData[],
    pages: number
}>> {
    // Fetch the patrols from the repository
    const result = await listPatrols(force, validFilters, receivedFilters, page, entriesPerPage);

    // Ensure all officers are ordered by their rank and callsign
    for (const patrol of result.patrols) {
        patrol.officers = await sortPatrolOfficers(force, patrol.officers);
    }

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

    // * Check if the dates of the patrol make sense
    // Dates can't be from future
    if (patrolData.start > dateToUnix(new Date()) || (patrolData.end !== undefined && patrolData.end > dateToUnix(new Date()))) {
        return {
            result: false,
            status: 400,
            message: "Não podes criar uma patrulha no futuro"
        }
    }

    // * If the current officer is not in the list of officers, add it
    if (!patrolData.officers.includes(requestingOfficer)) {
        patrolData.officers.push(requestingOfficer);
    }

    // Loop through all the officers and check if they exist and aren't in antoher patrol or inactive
    for (const officerNif of patrolData.officers) {
        const [canBeInPatrol, error] = await canOfficerBeInPatrol(force, officerNif, unixToDate(patrolData.start), patrolData.end ? unixToDate(patrolData.end): null);

        if (!canBeInPatrol) {
            return {
                result: false,
                status: 400,
                message: error
            }
        }
    }

    // Since all officers exist, create the patrol
    await createPatrol(force,
        requestingOfficer,
        patrolData.type,
        patrolData.special_unit ?? null,
        patrolData.officers,
        unixToDate(patrolData.start),
        patrolData.end ? unixToDate(patrolData.end): null,
        patrolData.notes ?? null
    );

    // If everything went well, return success
    return {
        result: true,
        status: 201,
        message: "Patrulha criada com sucesso"
    }
}

export async function patrolEdit(force: string, patrolData: InnerPatrolData, changes: EditPatrolBody): Promise<DefaultReturn<void>> {
    // First of all, check if the user can edit this patrol
    if (!patrolData.editable) {
        return {
            result: false,
            status: 403,
            message: "Não tem permissões para editar esta patrulha"
        }
    }

    // Loop through all the officers and check if they exist and aren't in antoher patrol or inactive
    if (changes.officers) {
        for (const officerNif of changes.officers) {
            const [canBeInPatrol, error] = await canOfficerBeInPatrol(force, officerNif, changes.start ? unixToDate(changes.start): patrolData.start, changes.end ? unixToDate(changes.end): patrolData.end, `${patrolData.force}${patrolData.id}`);

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