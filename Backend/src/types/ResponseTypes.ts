import express from "express";
import {routeMethodType} from "../api/routes";
import {OfficerData, OfficerDataRaw} from "@portalseguranca/api-types/officers/output";

export type APIResponse = express.Response & {
    locals: {
        routeDetails: routeMethodType | null
        user: number | null
    }
}

export type OfficerInfoAPIResponse = APIResponse & {
    locals: {
        requestedOfficerData: OfficerData | OfficerDataRaw
    }
}