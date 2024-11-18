import {RequestSuccess} from "../../index";

export interface OfficerLastShiftResponse extends RequestSuccess {
    data: {
        last_shift: string
    }
}