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

export type ExpressResponse<BodyType = object> = express.Response<BodyType | RequestError | BaseResponse> & {
    locals: {
        ws: Server
    }
}

export type APIResponse<BodyType = object> = ExpressResponse<BodyType> & {
    locals: {
        routeDetails: routeMethodType
        queryParams: ReceivedQueryParams
        loggedOfficer: InnerOfficerData
    }
}

export type OfficerInfoAPIResponse<BodyType = object> = APIResponse<BodyType> & {
    locals: {
        targetOfficer: InnerOfficerData | null
    }
}

export type AccountInfoAPIResponse<BodyType = object> = APIResponse<BodyType> & {
    locals: {
        targetAccount: InnerAccountData
    }
}

export type OfficerJustificationAPIResponse<BodyType = object> = OfficerInfoAPIResponse<BodyType> & {
    locals: {
        justification: InnerOfficerJustificationData
    }
}

export type OfficerEvaluationAPIResponse<BodyType = object> = OfficerInfoAPIResponse<BodyType> & {
    locals: {
        evaluation: InnerOfficerEvaluation
    }
}

export type PatrolInfoAPIResponse<BodyType = object> = APIResponse<BodyType> & {
    locals: {
        patrol: InnerPatrolData
    }
}

export type EventInfoAPIResponse<BodyType = object> = APIResponse<BodyType> & {
    locals: {
        event: InnerForceEvent
    }
}

export type AnnouncementInfoAPIResponse<BodyType = object> = APIResponse<BodyType> & {
    locals: {
        announcement: InnerAnnouncement
    }
}