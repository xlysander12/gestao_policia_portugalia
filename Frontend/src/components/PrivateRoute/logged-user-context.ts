import {createContext} from "react";
import {UserForce} from "@portalseguranca/api-types/account/output";

export type OfficerSpecialUnitType = {
    id: number,
    role: number
}

export type LoggedUserContextType = {
    info: {
        personal: {
            name: string,
            nif: number,
            phone: number,
            iban: string,
            kms: number,
            discord: string,
            steam: string
        },
        professional: {
            patent: number,
            callsign: string,
            status: number,
            entry_date: string,
            promotion_date: string,
            special_units: OfficerSpecialUnitType[]
        }
    },
    intents: {[key: string]: boolean},
    forces: UserForce[]
}

export const LoggedUserContext = createContext<LoggedUserContextType>({
    info: {
        personal: {
            name: "",
            nif: 0,
            phone: 0,
            iban: "",
            kms: 0,
            discord: "",
            steam: ""
        },
        professional: {
            patent: 0,
            callsign: "",
            status: 0,
            entry_date: "",
            promotion_date: "",
            special_units: []
        }
    },
    intents: {
        officers: false,
        activity: false,
        punishments: false,
        evaluations: false
    },
    forces: []
});
