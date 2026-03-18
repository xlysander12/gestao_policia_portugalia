import * as rt from "runtypes";

export const ListAuditLogsQueryParams = rt.Partial({
    after: rt.String.withConstraint(string => !isNaN(parseInt(string))),
    before: rt.String.withConstraint(string => !isNaN(parseInt(string))),
    author: rt.String.withConstraint(string => !isNaN(parseInt(string))),
    module: rt.String,
    action: rt.String,
    type: rt.String,
    target: rt.String.withConstraint(string => !isNaN(parseInt(string))),
    code: rt.String.withConstraint(string => !isNaN(parseInt(string))),
    page: rt.String.withConstraint(string => !isNaN(parseInt(string))),
});
export type ListAuditLogsQueryParams = rt.Static<typeof ListAuditLogsQueryParams>;