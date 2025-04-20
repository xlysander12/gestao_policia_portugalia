import {BaseResponse} from "../index";

export interface MinifiedEvent {
    id: number
    force: string
    title: string
    start: number
    end: number
}

export interface ForceEvent extends MinifiedEvent{
    type: number
    special_unit: number | null
    description: string | null
    assignees: number[]
}

export interface EventsListResponse extends BaseResponse {
    data: MinifiedEvent[]
}

export interface EventDetailsResponse extends BaseResponse {
    data: ForceEvent
}