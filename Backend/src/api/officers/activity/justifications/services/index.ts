import {DefaultReturn} from "../../../../../types";
import {OfficerJustification, OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {
    createOfficerJustification,
    getOfficerJustificationDetails,
    getOfficerJustificationsHistory, updateOfficerJustificationStatus
} from "../repository";
import {dateToString, stringToDate} from "../../../../../utils/date-handler";
import {getForceInactivityTypes} from "../../../../util/repository";

export async function officerHistory(force: string, nif: number): Promise<DefaultReturn<OfficerMinifiedJustification[]>> {
    // Call the repository to get the data
    let result = await getOfficerJustificationsHistory(force, nif);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: result.map((r) => {
            return {
                id: r.id,
                type: r.type,
                start: dateToString(r.start, false),
                end: r.end ? dateToString(r.end, false): null,
                status: r.status,
                managed_by: r.managed_by
            }
        })
    }
}

export async function officerJustificationDetails(force: string, nif: number, id: number): Promise<DefaultReturn<OfficerJustification>> {
    // Call the repository to get the data
    let result = await getOfficerJustificationDetails(force, nif, id);

    // Return the result
    if (result === null) {
        return {
            result: false,
            status: 404,
            message: "Justificação não encontrada"
        }
    }

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: {
            id: result.id,
            type: result.type,
            start: dateToString(result.start, false),
            end: result.end ? dateToString(result.end, false): null,
            description: result.description,
            status: result.status,
            managed_by: result.managed_by
        }
    }
}

export async function officerJustificationCreate(force: string, nif: number, type: number, description: string, start: string, end?: string): Promise<DefaultReturn<void>> {
    // * Make sure the provided type is valid
    // Get the types of inactivity
    let inactivityTypes = await getForceInactivityTypes(force);

    // Check if the provided type is a valid id
    if (!inactivityTypes.map((t) => t.id).includes(type)) {
        // If the type is invalid, return an error
        return {
            result: false,
            status: 400,
            message: "Tipo de inatividade inválido"
        }
    }

    // * Call the repository to create the justification
    await createOfficerJustification(force, nif, type, description, stringToDate(start), end ? stringToDate(end): undefined);

    // Return the result
    return {
        result: true,
        status: 201,
        message: "Justificação criada com sucesso"
    }
}

export async function officerJustificationUpdateStatus(force: string, nif: number, id: number, approved: boolean, managed_by: number): Promise<DefaultReturn<void>> {
    // * Make sure the provided justification id is valid
    let justification = await getOfficerJustificationDetails(force, nif, id);

    // If the justification doesn't exist, return an error
    if (justification === null) {
        return {
            result: false,
            status: 404,
            message: "Justificação não encontrada"
        }
    }

    // * Call the repository to update the justification status
    await updateOfficerJustificationStatus(force, nif, id, approved, managed_by);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Justificação atualizada com sucesso"
    }
}