import {OfficerData} from "@portalseguranca/api-types/officers/output";
import {PatrolData} from "@portalseguranca/api-types/patrols/output";
import {Evaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {ForceEvent, MinifiedEvent} from "@portalseguranca/api-types/events/output";
import {Announcement} from "@portalseguranca/api-types/announcements/output";
import {MinifiedDecision} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";

export interface InnerOfficerData extends Omit<OfficerData, "entry_date" | "promotion_date" | "fire_reason"> {
    entry_date: Date,
    promotion_date: Date | null
    isFormer: boolean
    force: string
    fire_reason: string | null
}

export interface InnerAccountData {
    nif: number,
    password: string | null,
    password_login: boolean,
    discord_login: boolean,
    suspended: boolean,
    last_interaction: Date | null,
    intents: Record<string, boolean>
}

export interface InnerOfficerJustificationData {
    id: number
    officer: number
    type: number
    start: Date
    end: Date | null
    description: string
    status: "pending" | "approved" | "denied"
    comment: string | null
    managed_by: number | null
    timestamp: Date
}

export interface InnerOfficerEvaluation extends Omit<Evaluation, "timestamp"> {
    timestamp: Date
}

export interface InnerMinifiedDecision extends Omit<MinifiedDecision, "ceremony"> {
    ceremony: Date
}

export interface InnerPatrolData extends Omit<PatrolData, "id" | "start" | "end"> {
    id: number
    start: Date
    end: Date | null
    force: string,
    editable?: boolean
}

export interface InnerMinifiedEvent extends Omit<MinifiedEvent, "start" | "end"> {
    start: Date
    end: Date
}

export interface InnerForceEvent extends Omit<ForceEvent, "start" | "end"> {
    start: Date
    end: Date
}

export interface InnerAnnouncement extends Omit<Announcement, "expiration" | "id" | "created"> {
    id: number
    force: string
    created: Date
    expiration: Date | null
}

export interface InnerError {
    code: string
    route: string
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD"
    body: string
    timestamp: Date
    stack: string
}