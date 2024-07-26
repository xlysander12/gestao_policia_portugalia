// Forces list
import {type} from "node:os";

export const FORCES = ["psp", "gnr"];
export type ForceType = any | "psp" | "gnr";

// Necessary information for the request
export const NO_TOKEN_REQUIRED_ROUTES = [[/\/util\/.*/, "*"], [/\/account\/login/, "POST"]];
export const NO_FORCE_REQUIRED_ROUTES = [[/\/account\/login/, "POST"]]

export type IntentRequiredRoute = {
    route: RegExp,
    methods: string | string[],
    intents: string | string[]
}
export const INTENT_REQUIRED_ROUTES: IntentRequiredRoute[] = [
    {route: /\/account\/info\/.*/, methods: ["PATCH", "PUT", "DELETE"], intents: "accounts"},
    {route: /\/officer-info\/.*/, methods: ["PUT", "PATCH", "DELETE"], intents: "officers"}
]