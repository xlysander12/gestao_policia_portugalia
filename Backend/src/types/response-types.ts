import express from "express";
import {routeMethodType} from "../api/routes";
import {InnerAccountData, InnerOfficerData, InnerOfficerJustificationData} from "./inner-types";

export type APIResponse = express.Response & {
    locals: {
        routeDetails: routeMethodType
        loggedOfficer: InnerOfficerData
    }
}

export type OfficerInfoAPIResponse = APIResponse & {
    locals: {
        targetOfficer: InnerOfficerData
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