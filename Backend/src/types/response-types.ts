import express from "express";
import {routeMethodType} from "../api/routes";
import {InnerAccountData, InnerOfficerData, InnerOfficerJustificationData, InnerPatrolData} from "./inner-types";
import {ReceivedQueryParams} from "../utils/filters";
import { RequestError, RequestSuccess } from "@portalseguranca/api-types";

export type ExpressResponse<BodyType = {}> = express.Response<BodyType | RequestError | RequestSuccess>

export type APIResponse<BodyType = {}> = ExpressResponse<BodyType> & {
    locals: {
        routeDetails: routeMethodType
        queryParams: ReceivedQueryParams
        loggedOfficer: InnerOfficerData
    }
}

export type OfficerInfoAPIResponse<BodyType = {}> = APIResponse<BodyType> & {
    locals: {
        targetOfficer: InnerOfficerData | null
    }
}

export type AccountInfoAPIResponse<BodyType = {}> = APIResponse<BodyType> & {
    locals: {
        targetAccount: InnerAccountData
    }
}

export type OfficerJustificationAPIResponse<BodyType = {}> = OfficerInfoAPIResponse<BodyType> & {
    locals: {
        justification: InnerOfficerJustificationData
    }
}

export type PatrolInfoAPIResponse<BodyType = {}> = APIResponse<BodyType> & {
    locals: {
        patrol: InnerPatrolData
    }
}