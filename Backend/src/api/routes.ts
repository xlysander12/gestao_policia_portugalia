import {
    ChangePasswordRequestBody,
    LoginRequestBody,
    ValidateTokenRequestBody
} from "@portalseguranca/api-types/account/input";
import { SubmitIssueRequestBody } from "@portalseguranca/api-types/metrics/input";

export type methodType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type routesType = {
    [key: string]: {
        methods: {
            [key in methodType]?: {
                requiresToken: boolean,
                requiresForce: boolean,
                intents?: string[],
                body?: {
                    type: any
                }
            }
        }
    }
}

/**
 * @description: This file contains all the routes of the API with their respective methods, paths, required intents and body types
 */
const routes: routesType = {
    // * Account routes
    // Route to validate a token
    "/accounts/validateToken": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: ValidateTokenRequestBody
                }
            }
        }
    },

    // Route to login a user
    "/accounts/login": {
        methods: {
            POST: {
                requiresToken: false,
                requiresForce: false,
                body: {
                    type: LoginRequestBody
                }
            }
        }
    },

    // Route to change the password of a logged user
    "/accounts/changepassword": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: ChangePasswordRequestBody
                }
            }
        }
    },

    // Route to reset the password of a user
    "/accounts/.*/resetpassword": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            }
        }
    },

    // Route to update the intents of a user
    "/accounts/.*/intents": {
        methods: {
            PATCH: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            }
        }
    },

    // Route to create an account for an existing officer
    "/accounts/.*": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            }
        }
    },

    // * Metrics routes
    // Route to submit an issue
    "/metrics/issue": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: SubmitIssueRequestBody
                }
            }
        }
    },

    // Route to submit a suggestion
    "/metrics/suggestion": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: SubmitIssueRequestBody
                }
            }
        }
    },
}

// ! Make sure there are no routes that require a token but don't require a force.
// ! If there are, throw an error and stop the server from starting
for (const route of Object.keys(routes)) {
    for (let method of Object.keys(routes[route].methods)) {
        if (routes[route].methods[method as methodType]!.requiresToken && !routes[route].methods[method as methodType]!.requiresForce) {
            throw new Error(`Route '${route}' requires a token but doesn't require a force`);
        }
    }
}

export default routes;