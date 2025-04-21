import {BaseResponse, SocketResponse} from "../index";

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
    author: number
    description: string | null
    assignees: number[]
}

export interface EventsListResponse extends BaseResponse {
    data: MinifiedEvent[]
}

export interface EventDetailsResponse extends BaseResponse {
    data: ForceEvent
}

export interface ExistingEventSocket extends SocketResponse {
    id: number
    force: string
}