import {String, Number, Record, Static} from "runtypes";

export const ChangeLastCeremonyRequestBody = Record({
    timestamp: Number
});
export type ChangeLastCeremonyRequestBodyType = Static<typeof ChangeLastCeremonyRequestBody>;

export const ForceTopHoursParams = Record({
    week_end: String.withConstraint(s => !isNaN(parseInt(s)))
});
export type ForceTopHoursParams = Static<typeof ForceTopHoursParams>;