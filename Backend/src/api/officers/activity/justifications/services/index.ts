import {DefaultReturn} from "../../../../../types";
import {OfficerMinifiedJustification} from "@portalseguranca/api-types/officers/activity/output";
import {getOfficerJustificationsHistory} from "../repository";
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
                start: dateToString(r.start, false),
                end: dateToString(r.end, false),
                status: r.status,
                managed_by: r.managed_by
            }
        })
    }
}