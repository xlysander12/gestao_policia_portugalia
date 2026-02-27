import {String, Number, Record, Static, Optional} from "runtypes";

export const ChangeLastCeremonyRequestBody = Record({
    timestamp: Number
});
export type ChangeLastCeremonyRequestBodyType = Static<typeof ChangeLastCeremonyRequestBody>;

export const ForceTopHoursParams = Record({
    week_end: String.withConstraint(s => !isNaN(parseInt(s)))
});
export type ForceTopHoursParams = Static<typeof ForceTopHoursParams>;

export const AuditLogQueryParams = Record({
    page: Optional(String.withConstraint(s => !isNaN(parseInt(s))))
});
export type AuditLogQueryParamsType = Static<typeof AuditLogQueryParams>;