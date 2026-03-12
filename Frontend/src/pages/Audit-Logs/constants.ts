import { MODULE } from "@portalseguranca/api-types";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";


function populateVar<T>(callback: () => T) {
    return callback();
}

export const TRANSLATED_MODULES = populateVar(() => {
    const modules: {[key: string]: string} = {};

    Object.values(MODULE).map(mod => {
        switch (mod) {
            case MODULE.ACCOUNTS:
                modules[mod] = "Contas";
                break;
            case MODULE.OFFICERS:
                modules[mod] = "Efetivos";
                break;
            case MODULE.ACTIVITY:
                modules[mod] = "Atividade";
                break;
            case MODULE.PATROLS:
                modules[mod] = "Patrulhas";
                break;
            case MODULE.EVALUATIONS:
                modules[mod] = "Avaliações";
                break;
            case MODULE.CEREMONY_DECISIONS:
                modules[mod] = "Decisões de Cerimónia";
                break;
            case MODULE.EVENTS:
                modules[mod] = "Eventos";
                break;
            case MODULE.ANNOUNCEMENTS:
                modules[mod] = "Anúncios";
                break;
            default:
                modules[mod] = mod;
                break;
        }
    });

    return modules;
});

export const TRANSLATED_ACTIONS = populateVar(() => {
    const actions: {[key: string]: string} = {};

    ["add", "delete", "update", "restore", "manage"].map(action => {
        switch (action) {
            case "add":
                actions[action] = "Adição";
                break;
            case "delete":
                actions[action] = "Eliminação";
                break;
            case "update":
                actions[action] = "Modificação";
                break;
            case "restore":
                actions[action] = "Restauração";
                break;
            case "manage":
                actions[action] = "Gestão";
                break;
        }
    });

    return actions;
});

export const ACTIONS_COLORS = populateVar(() => {
    const actions: {[key: string]: string} = {};

    ["add", "delete", "update", "restore", "manage"].map(action => {
        switch (action) {
            case "add":
                actions[action] = "#22C55E";
                break;
            case "delete":
                actions[action] = "#EF4444";
                break;
            case "update":
                actions[action] = "#3B82F6";
                break;
            case "restore":
                actions[action] = "#F59E0B";
                break;
            case "manage":
                actions[action] = "#6B7280";
                break;
        }
    });

    return actions;
});

/*
** Conditions for this to be true:
** - The module must be either OFFICERS or ACCOUNTS (since accounts are also officers)
** - The module is ACTIVITY, and the action is "add"
** - The module is EVALUATIONS, and the action is "add
*/
export function isTargetOfficer(entryData: {module: string, action: string, type?: string | null}) {
    return entryData.module as MODULE === MODULE.OFFICERS ||
        (entryData.module as MODULE === MODULE.ACCOUNTS && entryData.type !== "password_change") ||
        (entryData.module as MODULE === MODULE.ACTIVITY && entryData.action === "add") ||
        (entryData.module as MODULE === MODULE.EVALUATIONS && entryData.action === "add");
}

export const PLACEHOLDER_OFFICER_DATA: MinifiedOfficerData = {
    name: "Desconhecido",
    nif: 0,
    callsign: "N/A",
    patent: 1,
    status: 0
}