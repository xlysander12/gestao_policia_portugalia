import {DefaultReturn} from "../../../../../../types";
import {fetchLastDate, updateLastDate} from "../repository";

export async function getOfficerLastShift(force: string, nif: number, field: string): Promise<DefaultReturn<Date | null>> {
    // Fetch the last shift of the officer from the repository
    const last_shift = await fetchLastDate(force, nif, field);

    if (last_shift === null) {
        return {
            result: false,
            status: 404,
            message: "Não foi encontrado nenhuma data anterior para o efetivo."
        }
    }

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso.",
        data: last_shift
    }
}

export async function updateOfficerLastShift(force: string, nif: number, field: string, date: number | null): Promise<DefaultReturn<void>> {
    // Call the repository to update the last shift of the officer
    await updateLastDate(force, nif, field, date);

    return {
        result: true,
        status: 200,
        message: "Operação efetuada com sucesso."
    }
}