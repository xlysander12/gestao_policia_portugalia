import {DefaultReturn, InnerOfficerData} from "../../../types";
import {MinifiedEvent} from "@portalseguranca/api-types/events/output";
import {createEvent, deleteEvent, editEvent, getEvents} from "../repository";
import {dateToUnix} from "../../../utils/date-handler";
import {CreateEventBody, EditEventBody} from "@portalseguranca/api-types/events/input";
import {getEventTypes, getForceSpecialUnits} from "../../util/repository";
import {InnerForceEvent} from "../../../types/inner-types";
import {userHasIntents} from "../../accounts/repository";

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

export async function createEventService(force: string, logged_user: InnerOfficerData, event_data: CreateEventBody): Promise<DefaultReturn<void>> {
    // * Make sure all the required fields, depending on the given type are present
    // Fetch the type object
    const event_type = (await getEventTypes(force)).find(event_type => event_type.id === event_data.type);

    // If the type wasn't found, return error
    if (!event_type) {
        return {
            result: false,
            status: 400,
            message: "Tipo de Evento inválido"
        }
    }

    // Check if the logged user has the required intent to create the event
    if (event_type.intent && !(await userHasIntents(logged_user.nif, force, event_type.intent))) {
        return {
            result: false,
            status: 403,
            message: "Não tens permissão para criar este tipo de evento"
        }
    }

    // If the Event type is of the "special_unit" variant, ensure a Special Unit was given
    if (event_type.variant === "special_unit") {
        if (!event_data.special_unit) {
            return {
                result: false,
                status: 400,
                message: "É preciso fornecer uma Unidade Especial para este Evento"
            }
        }

        // Check if the given Special Unit is valid
        const special_unit = (await getForceSpecialUnits(force)).find(unit => unit.id === event_data.special_unit);
        if (!special_unit) {
            return {
                result: false,
                status: 400,
                message: "Unidade Especial inválida"
            }
        }
    } else if (event_type.variant === "custom" && (!event_data.title || event_data.title.trim() === "")) { // If the Event type is of the variant "custom", a title must have been given and cannot be an Empty string
        return {
            result: false,
            status: 400,
            message: "É necessário ser atribuído um título ao Evento"
        }
    }

    // If every check went positive, apply the data to the repository
    await createEvent(force, logged_user.nif, event_data);

    return {
        result: true,
        status: 201,
        message: "Operação concluída com sucesso"
    }
}

export async function editEventService(force: string, event: InnerForceEvent, changes: EditEventBody): Promise<DefaultReturn<void>> {
    // * If the event is not of type "custom" and assignees were provided, return an error
    // Getting the Event Type
    const event_type = (await getEventTypes(force)).find(event_type => event_type.id === event.type)!;

    if (event_type.variant !== "custom" && changes.assignees !== undefined && changes.assignees.length > 0) {
        return {
            result: false,
            status: 400,
            message: "Não podem ser destacados Efetivos para este Evento"
        }
    }

    // Calling the repository to apply the changes
    await editEvent(force, event.id, changes);

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso"
    }
}

export async function deleteEventService(force: string, event: InnerForceEvent): Promise<DefaultReturn<void>> {
    // Call the repository to delete the event
    await deleteEvent(force, event.id);

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso"
    }
}