import {BaseResponse, SocketResponse} from "../../../index";

export interface MinifiedDecision {
    id: number
    target: number
    category: number
    ceremony_event: number
    decision: number | null
}

export interface CeremonyDecision extends MinifiedDecision {
    details: string
}

export interface CeremonyDecisionsListResponse extends BaseResponse {
    meta: {
        pages: number
    }
    data: MinifiedDecision[]
}

export interface  CeremonyDecisionInfoResponse extends BaseResponse {
    data: CeremonyDecision
}

export interface CeremonyDecisionSocket extends SocketResponse {
    target: number
}

export interface AddCeremonyDecisionSocket extends CeremonyDecisionSocket {
    action: "add"
}

export interface UpdateCeremonyDecisionSocket extends CeremonyDecisionSocket {
    action: "update"
    id: number
}

export interface DeleteCeremonyDecisionSocket extends CeremonyDecisionSocket {
    action: "delete"
    id: number
}