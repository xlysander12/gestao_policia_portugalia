import {DefaultReturn} from "../../../../../../types";
import {fetchLastShift, updateLastShift} from "../repository";

export async function getOfficerLastShift(force: string, nif: number): Promise<DefaultReturn<Date | null>> {
    // Fetch the last shift of the officer from the repository
    const last_shift = await fetchLastShift(force, nif);

    if (last_shift === null) {
        return {
            result: false,
            status: 404,
            message: "Não foi encontrado nenhum turno anterior para o efetivo."
        }
    }

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso.",
        data: last_shift
    }
}

export async function updateOfficerLastShift(force: string, nif: number, last_shift: Date | null): Promise<DefaultReturn<void>> {
    // Call the repository to update the last shift of the officer
    await updateLastShift(force, nif, last_shift);

    return {
        result: true,
        status: 200,
        message: "Operação efetuada com sucesso."
    }
}