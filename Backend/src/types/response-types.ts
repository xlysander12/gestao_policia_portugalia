import express from "express";
import {routeMethodType} from "../api/routes";
import {InnerAccountData, InnerOfficerData, InnerOfficerJustificationData} from "./inner-types";
import {ReceivedQueryParams} from "../utils/filters";

export type APIResponse = express.Response & {
    locals: {
        routeDetails: routeMethodType
        queryParams: ReceivedQueryParams
        loggedOfficer: InnerOfficerData
    }
}

export type OfficerInfoAPIResponse = APIResponse & {
    locals: {
        targetOfficer: InnerOfficerData | null
    }
}

export type AccountInfoAPIResponse = APIResponse & {
    locals: {
        targetAccount: InnerAccountData
    }
}

export type OfficerJustificationAPIResponse = OfficerInfoAPIResponse & {
    locals: {
        justification: InnerOfficerJustificationData
    }
}