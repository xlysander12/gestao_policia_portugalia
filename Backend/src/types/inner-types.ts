import {OfficerDataRaw} from "@portalseguranca/api-types/officers/output";

export interface InnerOfficerData extends Omit<OfficerDataRaw, "entry_date" | "promotion_date"> {
    entry_date: Date,
    promotion_date: Date | null
}