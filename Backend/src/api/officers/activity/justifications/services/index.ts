import {DefaultReturn} from "../../../../../types";
import {OfficerJustification, OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {getOfficerJustificationDetails, getOfficerJustificationsHistory} from "../repository";
import {dateToString} from "../../../../../utils/date-handler";

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
                end: dateToString(r.end, false),
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
            end: dateToString(result.end, false),
            description: result.description,
            status: result.status,
            managed_by: result.managed_by
        }
    }
}