import {
    ChangeAccountInfoRequestBody,
    ChangePasswordRequestBody,
    LoginRequestBody,
    ValidateTokenRequestBody
} from "@portalseguranca/api-types/account/input";
import { SubmitIssueRequestBody } from "@portalseguranca/api-types/metrics/input";
import {
    CreateOfficerRequestBody,
    DeleteOfficerRequestBody,
    UpdateOfficerRequestBody
} from "@portalseguranca/api-types/officers/input";
import {AddOfficerHoursBody, UpdateOfficerLastShiftBody} from "@portalseguranca/api-types/officers/activity/input";
import {Record} from "runtypes";

export type methodType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type filterType = {
    [key: string]: {
        queryFunction: () => string,
        valueFunction?: (value: any) => any
    }
}

export type routeMethodType = {
    requiresToken: boolean,
    requiresForce: boolean,
    intents?: string[],
    filters?: filterType,
    body?: {
        type: Record<any, any>
    }
}

export type routeType = {
    methods: {
        [key in methodType]?: routeMethodType
    }
}

export type routesType = {
    [key: string]: routeType
}

const accountRoutes: routesType = {
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
    "/accounts/change-password": {
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
    "/accounts/.+/resetpassword": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            }
        }
    },

    // Route to get the forces of an account
    "/accounts/.+/forces": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            }
        }
    },

    // * Routes related to creation and data fetching of exsiting accounts
    "/accounts/.+": {
        methods: {
            // Route to get information about an account
            GET: {
                requiresToken: true,
                requiresForce: true
            },

            // Route to create an account for an existing officer
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            },

            // Route to update an account's permissions and suspended state
            PATCH: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"],
                body: {
                    type: ChangeAccountInfoRequestBody
                }
            },
            DELETE: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            }
        }
    },
}

const metricsRoutes: routesType = {
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

const utilRoutes: routesType = {
    // Route to get all patents of a force
    "/util/patents": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all statuses of a force
    "/util/statuses": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all special units of a force
    "/util/special-units": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all intents of a force
    "/util/intents": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },
}

const officersRoutes: routesType = {
    // Route to get all officers of a force
    "^/officers$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true,
                filters: {
                    search: {
                        queryFunction: () => `CONCAT(name, patent, callsign, nif, phone, discord) LIKE ?`,
                        valueFunction: (value: string) => `%${value}%`
                    }
                }
            }
        }
    },

    // * Routes about existing officers or to create new officers
    "/officers/.+": {
        methods: {
            // Route to get an officer's information
            GET: {
                requiresToken: true,
                requiresForce: true
            },

            // Route to create an officer
            PUT: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: CreateOfficerRequestBody
                }
            },

            // Route to update an officer's information
            PATCH: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: UpdateOfficerRequestBody
                }
            },

            // Route to delete an officer
            DELETE: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: DeleteOfficerRequestBody
                }
            }

        }
    },
}

const activityRoutes: routesType = {
    "/officers/.+/activity/last-shift": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            },
            PUT: {
                requiresToken: true,
                requiresForce: true,
                intents: ["activity"],
                body: {
                    type: UpdateOfficerLastShiftBody
                }
            }
        }
    },
    "/officers/.+/activity/hours$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true,
                filters: {
                    after: {
                        queryFunction: () => `week_start >= ? OR week_end >= ?`,
                        valueFunction: (value: string) => [value, value]
                    },
                    before: {
                        queryFunction: () => `week_end <= ? OR week_start <= ?`,
                        valueFunction: (value: string) => [value, value]
                    }
                }
            },
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["activity"],
                body: {
                    type: AddOfficerHoursBody
                }
            }
        }
    },
    "/officers/.+/activity/hours/.+": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            },
            DELETE: {
                requiresToken: true,
                requiresForce: true,
                intents: ["activity"]
            }
        }
    }
}

/**
 * @description This constant contains all the routes of the API with their respective methods, paths, required intents and body types
 */
const routes: routesType = {
    ...accountRoutes,
    ...metricsRoutes,
    ...utilRoutes,
    ...activityRoutes,
    ...officersRoutes
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