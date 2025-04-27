import {MinifiedOfficerData, OfficerData} from "@portalseguranca/api-types/officers/output";

export const BASE_API_URL = "/portugalia/portalseguranca/api";
export const BASE_URL = "/portugalia/portalseguranca";
export const BASE_WS_URL = "/portugalia/portalseguranca/ws";
export const PLACEHOLDER_OFFICER_DATA: {minified: MinifiedOfficerData, complete: OfficerData} = {
    complete: {
        name: "",
        patent: -1,
        nif: -1,
        status: -1,
        callsign: "",
        promotion_date: null,
        iban: "",
        kms: -1,
        phone: -1,
        steam: "",
        discord: -1,
        entry_date: -1,
        special_units: []
    },
    minified: {
        name: "",
        patent: -1,
        nif: -1,
        status: -1,
        callsign: ""
    }
}