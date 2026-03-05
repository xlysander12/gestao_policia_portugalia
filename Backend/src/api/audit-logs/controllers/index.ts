import {APIResponse} from "../../../types";
import express from "express";
import {auditLogEntry, auditLogsHistory} from "../services";
import { isQueryParamPresent } from "../../../utils/filters";
import {AuditLogEntryResponse, AuditLogHistoryResponse} from "@portalseguranca/api-types/audit-logs/output";
import {FORCE_HEADER} from "../../../utils/constants";

export async function listAuditLogsController(req: express.Request, res: APIResponse<AuditLogHistoryResponse>) {
    const result = await auditLogsHistory(
        req.header(FORCE_HEADER)!,
        res.locals.loggedOfficer,
        res.locals.routeDetails.filters!,
        res.locals.queryParams,
        isQueryParamPresent("page", res.locals.queryParams) ? parseInt(res.locals.queryParams.page) : 1,
    )

    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });
        return;
    }

    res.status(result.status).json({
        message: result.message,
        meta: {
            pages: result.data!.pages
        },
        data: result.data!.logs
    });
}

export async function getAuditLogEntryController(req: express.Request, res: APIResponse<AuditLogEntryResponse>) {
    // Get the log entry from the service
    const result = await auditLogEntry(req.header(FORCE_HEADER)!, parseInt(req.params.id));

    if (!result.result) {
        res.status(result.status).json({
            message: result.message
        });

        return;
    }

    res.status(result.status).json({
        message: result.message,
        data: result.data
    });
}