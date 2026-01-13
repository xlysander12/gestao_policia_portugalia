import express from "express";
import {routeMethodType} from "../api/routes";
import {
    InnerAccountData, InnerAnnouncement, InnerForceEvent,
    InnerOfficerData,
    InnerOfficerEvaluation,
    InnerOfficerJustificationData,
    InnerPatrolData
} from "./inner-types";
import {ReceivedQueryParams} from "../utils/filters";
import { RequestError, BaseResponse } from "@portalseguranca/api-types";
import {Server} from "socket.io";
import {CeremonyDecision} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";

export type ExpressResponse<BodyType extends BaseResponse = BaseResponse> = express.Response<BodyType | RequestError> & {
    locals: {
        ws: Server
    }
}

export type APIResponse<BodyType extends BaseResponse = BaseResponse> = ExpressResponse<BodyType> & {
    locals: {
        routeDetails: routeMethodType
        queryParams: ReceivedQueryParams
        loggedOfficer: InnerOfficerData
    }
}

export type OfficerInfoAPIResponse<BodyType extends BaseResponse = BaseResponse> = APIResponse<BodyType> & {
    locals: {
        targetOfficer: InnerOfficerData | null
    }
}

export type AccountInfoAPIResponse<BodyType extends BaseResponse = BaseResponse> = APIResponse<BodyType> & {
    locals: {
        targetAccount: InnerAccountData
    }
}

export type OfficerJustificationAPIResponse<BodyType extends BaseResponse = BaseResponse> = OfficerInfoAPIResponse<BodyType> & {
    locals: {
        justification: InnerOfficerJustificationData
    }
}

export type OfficerEvaluationAPIResponse<BodyType extends BaseResponse = BaseResponse> = OfficerInfoAPIResponse<BodyType> & {
    locals: {
        evaluation: InnerOfficerEvaluation
    }
}

export type CeremonyDecisionAPIResponse<BodyType extends BaseResponse = BaseResponse> = OfficerInfoAPIResponse<BodyType> & {
    locals: {
        decision: CeremonyDecision
    }
}

export type PatrolInfoAPIResponse<BodyType extends BaseResponse = BaseResponse> = APIResponse<BodyType> & {
    locals: {
        patrol: InnerPatrolData
    }
}

export type EventInfoAPIResponse<BodyType extends BaseResponse = BaseResponse> = APIResponse<BodyType> & {
    locals: {
        event: InnerForceEvent
    }
}

export type AnnouncementInfoAPIResponse<BodyType extends BaseResponse = BaseResponse> = APIResponse<BodyType> & {
    locals: {
        announcement: InnerAnnouncement
    }
}