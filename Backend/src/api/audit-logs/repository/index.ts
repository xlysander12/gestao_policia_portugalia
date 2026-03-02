import {InnerOfficerData} from "../../../types";
import {MODULE} from "@portalseguranca/api-types";
import {queryDB} from "../../../utils/db-connector";

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