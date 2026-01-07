import {DefaultReturn, InnerOfficerData} from "../../../../../../../types";
import {
    CeremonyDecision,
    MinifiedDecision
} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import {
    createCeremonyDecision,
    deleteCeremonyDecision,
    editCeremonyDecision,
    getCeremonyDecisions
} from "../repository";
import {RouteFilterType} from "../../../../../../routes";
import {ReceivedQueryParams} from "../../../../../../../utils/filters";
import {isQueryError} from "../../../../../../../middlewares/error-handler";
import {QueryError} from "mysql2";
import {getEvent, getEvents} from "../../../../../../events/repository";
import {getEventTypes, getForcePatents} from "../../../../../../util/repository";
import {EditCeremonyDecisionBody} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/input";
import {PatentData} from "@portalseguranca/api-types/util/output";
import {dateToUnix} from "../../../../../../../utils/date-handler";

export async function ceremonyDecisions(force: string, target: InnerOfficerData, loggedUser: InnerOfficerData, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1): Promise<DefaultReturn<{
    pages: number
    decisions: MinifiedDecision[]
}>> {
    // Get patent data from the logged user
    const logged_user_patent_data = await getForcePatents(force, loggedUser.patent) as PatentData;

    // Get values from repository
    const rep_result = await getCeremonyDecisions(force, target.nif, logged_user_patent_data.category, routeValidFilters, filters, page);

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso.",
        data: {
            pages: rep_result.pages,
            decisions: rep_result.decisions.map(decision => ({
                ...decision,
                ceremony_event: decision.ceremony_event,
            }))
        }
    }
}

export async function createDecision(force: string, target: InnerOfficerData, category: number, ceremony_event: number | null | undefined, decision: number, details: string): Promise<DefaultReturn<null>> {
    // * Check if the selected event is of variant "ceremony"
    // This is only done if a ceremony_event is provided
    if (ceremony_event !== null && ceremony_event !== undefined) {
        const event_data = await getEvent(force, ceremony_event, force);
        if (event_data === null) { // Ensure the event exists
            return {
                result: false,
                status: 400,
                message: "O evento selecionado não existe."
            }
        }

        const variant_check = (await getEventTypes(force)).filter(type => type.variant === "ceremony").some(type => type.id === event_data.type);
        if (!variant_check) {
            return {
                result: false,
                status: 400,
                message: "O evento selecionado não é uma Cerimónia de Subidas."
            }
        }
    } else {// If not ceremony_event was provided, get the next ceremony event
        const events = await getEvents(force, dateToUnix(new Date()));
        const ceremony_event_types = (await getEventTypes(force)).filter(type => type.variant === "ceremony").map(type => type.id);

        const next_ceremony_event =
            (await Promise.all(events.map(async minified_event => await getEvent(force, minified_event.id, force))))
            .filter(event => event !== null)
            .find(event => ceremony_event_types.includes(event.type));

        // If no event was found, return an error
        if (!next_ceremony_event) {
            return {
                result: false,
                status: 400,
                message: "Não existe nenhuma Cerimónia de Subidas agendada."
            }
        }

        ceremony_event = next_ceremony_event.id;
    }

    // Call the repository to appy the decision
    try {
        await createCeremonyDecision(force, target.nif, category, ceremony_event, decision, details);
    } catch (e) {
        if (isQueryError(e as Error) && (e as QueryError).errno === 1062) { // This means a duplicate entry
            return {
                result: false,
                status: 409,
                message: "Já existe uma decisão para esta cerimónia, desta Categoria, sobre este Efetivo."
            }
        }

        // If it's not a duplicate entry, re-throw the error
        throw e;
    }

    return {
        result: true,
        status: 201,
        message: "Decisão criada com sucesso."
    }
}

export async function editDecision(force: string, decision: CeremonyDecision, changes: EditCeremonyDecisionBody): Promise<DefaultReturn<null>> {
    // Call the repository to make the changes
    await editCeremonyDecision(force, decision.id, changes);

    return {
        result: true,
        status: 200,
        message: "Decisão editada com sucesso."
    }
}

export async function deleteDecision(force: string, decision: CeremonyDecision): Promise<DefaultReturn<null>> {
    // Call the repository to delete the decision
    await deleteCeremonyDecision(force, decision.id);

    return {
        result: true,
        status: 200,
        message: "Decisão eliminada com sucesso."
    }
}
