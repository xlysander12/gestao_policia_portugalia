import {Number, Record, Static} from "runtypes";

export const ChangeLastCeremonyRequestBody = Record({
    timestamp: Number
});
export type ChangeLastCeremonyRequestBodyType = Static<typeof ChangeLastCeremonyRequestBody>;