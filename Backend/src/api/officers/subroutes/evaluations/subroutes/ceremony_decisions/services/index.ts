import {DefaultReturn, InnerOfficerData} from "../../../../../../../types";
import {MinifiedDecision} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import {createCeremonyDecision, getCeremonyDecisions} from "../repository";
import {dateToUnix} from "../../../../../../../utils/date-handler";
import {RouteFilterType} from "../../../../../../routes";
import {ReceivedQueryParams} from "../../../../../../../utils/filters";
import {isQueryError} from "../../../../../../../middlewares/error-handler";
import {QueryError} from "mysql2";

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
                ceremony: dateToUnix(decision.ceremony),
            }))
        }
    }
}

export async function createDecision(force: string, target: InnerOfficerData, category: number, ceremony: Date, decision: number, details: string): Promise<DefaultReturn<null>> {
    // Call the repository to appy the decision
    try {
        await createCeremonyDecision(force, target.nif, category, ceremony, decision, details);
    } catch (e) {
        if (isQueryError(e as Error) && (e as QueryError).errno === 1062) { // This means a duplicate entry
            return {
                result: false,
                status: 409,
                message: "Já existe uma decisão para esta cerimónia sobre esta Categoria, para este Efetivo."
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
