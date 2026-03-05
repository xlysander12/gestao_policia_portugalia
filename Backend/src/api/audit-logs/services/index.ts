import {RouteFilterType} from "../../routes";
import {ReceivedQueryParams} from "../../../utils/filters";
import {DefaultReturn, InnerOfficerData} from "../../../types";
import {AuditLogData, MinifiedAuditLogData} from "@portalseguranca/api-types/audit-logs/output";
import {getAuditLogEntry, listAuditLogs} from "../repository";

export async function auditLogsHistory(force: string, loggedUser: InnerOfficerData, validFilters: RouteFilterType, receivedFilters: ReceivedQueryParams, page = 1, entriesPerPage = 10): Promise<DefaultReturn<{
    logs: MinifiedAuditLogData[],
    pages: number
}>> {
    // Get the logs from the repository
    const result = await listAuditLogs(force, loggedUser, validFilters, receivedFilters, page, entriesPerPage);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Operação efetuada com sucesso",
        data: result
    }
}

export async function auditLogEntry(force: string, id: number): Promise<DefaultReturn<AuditLogData>> {
    // Get the log entry from the database
    const entry = await getAuditLogEntry(force, id);

    return {
        result: entry !== null,
        status: entry !== null ? 200 : 404,
        message: entry !== null ? "Operação efetuada com sucesso" : "Entrada de log não encontrada",
        data: entry ?? undefined
    }
}