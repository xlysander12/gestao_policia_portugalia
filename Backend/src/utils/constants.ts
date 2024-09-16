// Forces list
import {type} from "node:os";

export const FORCES = ["psp", "gnr"];
export type ForceType = any | "psp" | "gnr";
export const PASSWORD_SALT_ROUNDS = 10;


// Necessary information for the request
export const NO_TOKEN_REQUIRED_ROUTES = [[/\/util\/.*/, "*"], [/\/accounts\/login/, "POST"]];
export const NO_FORCE_REQUIRED_ROUTES = [[/\/accounts\/login/, "POST"]]

export type IntentRequiredRoute = {
    route: RegExp,
    methods: string | string[],
    intents: string | string[]
}
export const INTENT_REQUIRED_ROUTES: IntentRequiredRoute[] = [
    {route: /\/accounts\/.*\/info/, methods: ["GET"], intents: "accounts"},
    {route: /\/accounts\/.*\/create/, methods: ["POST"], intents: "accounts"},
    {route: /\/officers\/.*/, methods: ["PUT", "PATCH", "DELETE"], intents: "officers"}
]