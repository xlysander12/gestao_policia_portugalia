import {InnerOfficerData} from "../../../types";
import {MODULE} from "@portalseguranca/api-types";
import {queryDB} from "../../../utils/db-connector";
import {RouteFilterType} from "../../routes";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../utils/filters";
import {AuditLogData, MinifiedAuditLogData} from "@portalseguranca/api-types/audit-logs/output";
import {dateToUnix} from "../../../utils/date-handler";

export async function createAuditLogEntry(
    force: string, user: InnerOfficerData,
    ip: string | null,
    module: MODULE,
    action: string,
    type: string | undefined,
    target: number | undefined | null,
    status_code: number,
    body: Record<string, never>,
) {
    // Store this change in the database
    await queryDB(force, `
        INSERT INTO audit_logs (nif, ip_address, module, action, type, target, details, status_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.nif, ip, module, action, type, target, JSON.stringify(body), status_code]);
}

export async function listAuditLogs(force: string, loggedUser: InnerOfficerData, routeFiltres: RouteFilterType, filters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<{
    logs: MinifiedAuditLogData[],
    pages: number
}> {
    const filtersResult = buildFiltersQuery(force, routeFiltres, filters, {
        subquery: `officers.patent <= ?`,
        value: loggedUser.patent
    });

    const result = await queryDB(force, `
        SELECT
            audit_logs.id,
            audit_logs.nif,
            audit_logs.timestamp,
            audit_logs.module,
            audit_logs.action,
            audit_logs.type,
            audit_logs.target,
            audit_logs.status_code
        FROM audit_logs
        JOIN officers ON audit_logs.nif = officers.nif
        ${filtersResult.query}
        ORDER BY audit_logs.timestamp DESC
        LIMIT ${entriesPerPage} OFFSET ${(page - 1) * entriesPerPage}
    `, filtersResult.values);

    const totalEntriesResult = (await queryDB(force, `
        SELECT COUNT(*)
        FROM audit_logs
        JOIN officers ON audit_logs.nif = officers.nif
        ${filtersResult.query}
    `, filtersResult.values));

    return {
        logs: result.map(log => ({
            id: log.id as number,
            nif: log.nif as number,
            timestamp: dateToUnix(log.timestamp as Date),
            module: log.module as string,
            action: log.action as string,
            type: log.type as string | null,
            target: log.target as number | null,
            status_code: log.status_code as number
        })),
        pages: Math.ceil((totalEntriesResult[0]["COUNT(*)"] as number) / entriesPerPage)
    }
}

export async function getAuditLogEntry(force: string, id: number): Promise<AuditLogData | null> {
    const result = await queryDB(force, `
        SELECT *
        FROM audit_logs
        WHERE id = ?
    `, [id]);

    if (result.length === 0) {
        return null;
    }

    return {
        id: result[0].id as number,
        nif: result[0].nif as number,
        ip_address: result[0].ip_address as string | null,
        timestamp: dateToUnix(result[0].timestamp as Date),
        module: result[0].module as string,
        action: result[0].action as string,
        type: result[0].type as string | null,
        target: result[0].target as number | null,
        details: JSON.parse(result[0].details as string) as Record<string, unknown>,
        status_code: result[0].status_code as number
    }
}