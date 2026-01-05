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
import {getEvent} from "../../../../../../events/repository";
import {getEventTypes} from "../../../../../../util/repository";
import {EditCeremonyDecisionBody} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/input";

export async function ceremonyDecisions(force: string, target: InnerOfficerData, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1): Promise<DefaultReturn<{
    pages: number
    decisions: MinifiedDecision[]
}>> {
    // Get values from repository
    const rep_result = await getCeremonyDecisions(force, target.nif, routeValidFilters, filters, page);

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

export async function createDecision(force: string, target: InnerOfficerData, category: number, ceremony_event: number, decision: number, details: string): Promise<DefaultReturn<null>> {
    // * Check if the selected event is of variant "ceremony"
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
