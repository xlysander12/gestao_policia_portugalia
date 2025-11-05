import {queryDB} from "../../../../../../../utils/db-connector";
import {InnerMinifiedDecision} from "../../../../../../../types/inner-types";
import {RouteFilterType} from "../../../../../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../../../../../utils/filters";

export async function getCeremonyDecisions(force: string, target_nif: number, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams): Promise<InnerMinifiedDecision[]> {

    const useFilters = routeValidFilters && filters;
    const filtersResult = useFilters ? buildFiltersQuery(force, routeValidFilters, filters, {subquery: "target = ?", value: target_nif}): null;

    const result = useFilters ?
                            await queryDB(force, `SELECT id, target, category, ceremony, decision FROM ceremony_decisions ${filtersResult!.query}`, filtersResult!.values) :
                            await queryDB(force, `SELECT id, target, category, ceremony, decision FROM ceremony_decisions WHERE target = ?`, target_nif);

    // For every row in result, map to MinifiedDecision
    return result.map((row) => ({
        id: row.id as number,
        target: row.target as number,
        category: row.category as number,
        ceremony: row.ceremony as Date,
        decision: row.decision as number,
    }));
}

export async function createCeremonyDecision(force: string, target_nif: number, category: number, ceremony: Date, decision: number, details: string): Promise<void> {
    await queryDB(force, `INSERT INTO ceremony_decisions (target, category, ceremony, decision, details) VALUES (?, ?, ?, ?, ?)`, [
        target_nif,
        category,
        ceremony,
        decision,
        details
    ]);
}