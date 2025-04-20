import {DefaultReturn} from "../../../types";
import {ForceEvent, MinifiedEvent} from "@portalseguranca/api-types/events/output";
import {getEvent, getEvents} from "../repository";
import {dateToUnix} from "../../../utils/date-handler";

export async function getEventsService(force: string, month?: number): Promise<DefaultReturn<MinifiedEvent[]>> {
    if (!month) {
        return {
            result: false,
            status: 400,
            message: "Deve ser fornecido um mês para a obtenção de eventos"
        }
    }

    // Call the repository to get the events
    const result = await getEvents(force, month);

    // Return all the events
    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso",
        data: result.map(event => ({
            id: event.id,
            force: event.force,
            title: event.title,
            start: dateToUnix(event.start),
            end: dateToUnix(event.end)
        }))
    }
}