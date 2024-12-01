import express from "express";
import {routeMethodType} from "../api/routes";
import {InnerOfficerData} from "./inner-types";

export type APIResponse = express.Response & {
    locals: {
        routeDetails: routeMethodType
        loggedUser: InnerOfficerData
    }
}

export type OfficerInfoAPIResponse = APIResponse & {
    locals: {
        targetOfficer: InnerOfficerData
    }
}