import {createContext} from "react";

export type LoggedUserContextType = {
    info: {
        personal: {
            name: string,
            nif: string,
            phone: string,
            iban: string,
            kms: string,
            discord: string,
            steam: string
        },
        professional: {
            patent: number,
            callsign: string,
            status: number,
            entry_date: string,
            promotion_date: string
        }
    },
    intents: {
        officer: boolean,
        activity: boolean,
        punishments: boolean,
        evaluations: boolean,
    }
}

export const LoggedUserContext = createContext<LoggedUserContextType>({
    info: {
        personal: {
            name: "",
            nif: "",
            phone: "",
            iban: "",
            kms: "",
            discord: "",
            steam: ""
        },
        professional: {
            patent: 0,
            callsign: "",
            status: 0,
            entry_date: "",
            promotion_date: ""
        }
    },
    intents: {
        officer: false,
        activity: false,
        punishments: false,
        evaluations: false
    }
});
