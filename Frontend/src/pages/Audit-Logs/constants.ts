import { MODULE } from "@portalseguranca/api-types";


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
                actions[action] = "green";
                break;
            case "delete":
                actions[action] = "red";
                break;
            case "update":
                actions[action] = "blue";
                break;
            case "restore":
                actions[action] = "lightgreen";
                break;
            case "manage":
                actions[action] = "darkblue";
                break;
        }
    });

    return actions;
});