import {queryDB} from "../../../../../../../utils/db-connector";
import {RouteFilterType} from "../../../../../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../../../../../utils/filters";
import {
    CeremonyDecision,
    MinifiedDecision
} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import {EditCeremonyDecisionBody} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/input";

export async function getCeremonyDecisions(force: string, target_nif: number, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams, page = 1, entries_per_page = 10): Promise<{
    pages: number
    decisions: MinifiedDecision[]
}> {

    const useFilters = routeValidFilters && filters;
    const filtersResult = useFilters ? buildFiltersQuery(force, routeValidFilters, filters, {subquery: "target = ?", value: target_nif}): null;

    const result = useFilters ?
                            await queryDB(force, `SELECT ceremony_decisions.id, target, category, ceremony, decision FROM ceremony_decisions JOIN events ON ceremony = events.id ${filtersResult!.query} LIMIT ${entries_per_page} OFFSET ${(page - 1) * entries_per_page}`, filtersResult!.values) :
                            await queryDB(force, `SELECT id, target, category, ceremony, decision FROM ceremony_decisions WHERE target = ? LIMIT ${entries_per_page} OFFSET ${(page - 1) * entries_per_page}`, target_nif);


    // Fetch the count of pages
    const count_result = await queryDB(force, `
        SELECT
            COUNT(*) AS count
        FROM
            ceremony_decisions
        JOIN events ON events.id = ceremony_decisions.ceremony
        ${filtersResult?.query}
    `, filtersResult?.values);

    // For every row in result, map to MinifiedDecision
    return {
        pages: Math.ceil((count_result[0].count as number) / entries_per_page),
        decisions: result.map((row) => ({
            id: row.id as number,
            target: row.target as number,
            category: row.category as number,
            ceremony_event: row.ceremony as number,
            decision: row.decision as number,
        }))
    };
}

export async function getCeremonyDecisionById(force: string, target_nif: number, decision_id: number): Promise<CeremonyDecision | null> {
    const result = await queryDB(force, `SELECT * FROM ceremony_decisions WHERE target = ? AND id = ?`, [target_nif, decision_id]);

    if (result.length === 0) {
        return null;
    }

    return {
        id: result[0].id as number,
        target: result[0].target as number,
        category: result[0].category as number,
        ceremony_event: result[0].ceremony as number,
        decision: result[0].decision as number,
        details: result[0].details as string,
    }
}


export async function createCeremonyDecision(force: string, target_nif: number, category: number, ceremony_event: number, decision: number, details: string): Promise<void> {
    await queryDB(force, `INSERT INTO ceremony_decisions (target, category, ceremony, decision, details) VALUES (?, ?, ?, ?, ?)`, [
        target_nif,
        category,
        ceremony_event,
        decision,
        details
    ]);
}

export async function editCeremonyDecision(force: string, id: number, changes: EditCeremonyDecisionBody): Promise<void> {
    // Build the query string and params depeding on the changes
    const params: (string | number)[] = [];
    const query = `UPDATE ceremony_decisions SET ${Object.keys(changes).reduce((acc ,field) => {
        acc += `${field} = ?, `;
        
        params.push(changes[field as keyof EditCeremonyDecisionBody]!);
        
        return acc;
    }, "").slice(0, -2)} WHERE id = ?`;
    
    await queryDB(force, query, [...params, id]);
}

export async function deleteCeremonyDecision(force: string, id: number): Promise<void> {
    await queryDB(force, `DELETE FROM ceremony_decisions WHERE id = ?`, [id]);
}