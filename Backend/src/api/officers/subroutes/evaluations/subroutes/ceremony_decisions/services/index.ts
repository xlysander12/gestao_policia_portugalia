import {DefaultReturn, InnerOfficerData} from "../../../../../../../types";
import {MinifiedDecision} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import {getCeremonyDecisions} from "../repository";
import {dateToUnix} from "../../../../../../../utils/date-handler";
import {RouteFilterType} from "../../../../../../routes";
import {ReceivedQueryParams} from "../../../../../../../utils/filters";

export async function ceremonyDecisions(force: string, target: InnerOfficerData, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams): Promise<DefaultReturn<MinifiedDecision[]>> {
    // Get values from repository
    const decisions = await getCeremonyDecisions(force, target.nif, routeValidFilters, filters);

    return {
        result: true,
        status: 200,
        message: "Operação concluída com sucesso.",
        data: decisions.map(decision => ({
            ...decision,
            ceremony: dateToUnix(decision.ceremony),
        }))
    }
}