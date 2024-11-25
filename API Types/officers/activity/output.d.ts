import {RequestSuccess} from "../../index";

export interface OfficerLastShiftResponse extends RequestSuccess {
    data: {
        last_shift: string
    }
}

interface OfficerSpecificHoursType {
    id: number,
    week_start: string,
    week_end: string,
    minutes: number,
    submitted_by: number
}

export interface OfficerSpecificHoursResponse extends RequestSuccess {
    data: OfficerSpecificHoursType
}

export interface OfficerHoursResponse extends RequestSuccess {
    data: OfficerSpecificHoursType[]
}