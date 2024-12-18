import {DefaultReturn} from "../../../../../types";
import {fetchLastShift} from "../repository";

export async function getOfficerLastShift(force: string, nif: number): Promise<DefaultReturn<Date | null>> {
    // Fetch the last shift of the officer from the repository
    let last_shift = await fetchLastShift(force, nif);

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
        data: last_shift
    }
}