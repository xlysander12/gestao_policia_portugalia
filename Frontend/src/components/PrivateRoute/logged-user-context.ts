import {createContext} from "react";
import {UserForce} from "@portalseguranca/api-types/account/output";
import {PatentData, SpecialUnitData, SpecialUnitRoleData, StatusData} from "@portalseguranca/api-types/util/output";

export type OfficerSpecialUnitType = {
    unit: SpecialUnitData,
    role: SpecialUnitRoleData
}

export type LoggedUserContextType = {
    info: {
        personal: {
            name: string,
            nif: number,
            phone: number,
            iban: string,
            kms: number,
            discord: number,
            steam: string
        },
        professional: {
            patent: PatentData,
            callsign: string,
            status: StatusData,
            entry_date: string,
            promotion_date: string | null,
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
            discord: 0,
            steam: ""
        },
        professional: {
            patent: {
                id: 0,
                name: "",
                max_evaluation: 0,
                leading_char: ""
            },
            callsign: "",
            status: {
                id: 0,
                name: "",
                color: "",
                canPatrol: false
            },
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
