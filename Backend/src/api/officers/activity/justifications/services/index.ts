import {DefaultReturn} from "../../../../../types";
import {OfficerJustification, OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {
    createOfficerJustification, deleteOfficerJustification,
    getOfficerJustificationDetails,
    getOfficerJustificationsHistory, updateOfficerJustificationDetails, updateOfficerJustificationStatus
} from "../repository";
import {dateToString, stringToDate} from "../../../../../utils/date-handler";
import {getForceInactivityTypes} from "../../../../util/repository";
import { ChangeOfficerJustificationBodyType } from "@portalseguranca/api-types/officers/activity/input";
import {InnerOfficerJustificationData} from "../../../../../types/inner-types";

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

export async function officerJustificationUpdateStatus(force: string, nif: number, justificationData: InnerOfficerJustificationData, approved: boolean, managed_by: number): Promise<DefaultReturn<void>> {
    // * Make sure the provided justification is pending
    if (justificationData.status !== "pending") {
        return {
            result: false,
            status: 403,
            message: "Esta justificação já foi processada e não pode ser alterada"
        }
    }

    // * Call the repository to update the justification status
    await updateOfficerJustificationStatus(force, nif, justificationData.id, approved, managed_by);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Justificação atualizada com sucesso"
    }
}

export async function officerJustificationChangeDetails(force: string, nif: number, justificationData: InnerOfficerJustificationData, changes: ChangeOfficerJustificationBodyType): Promise<DefaultReturn<void>> {
    // * Call the repository to update the justification
    await updateOfficerJustificationDetails(force, nif, justificationData.id, changes);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Justificação atualizada com sucesso"
    }
}

export async function officerJustificationDelete(force: string, nif: number, justificationData: InnerOfficerJustificationData): Promise<DefaultReturn<void>> {
    // * cCall the repository to delete the justification
    await deleteOfficerJustification(force, nif, justificationData.id);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Justificação eliminada com sucesso"
    }
}