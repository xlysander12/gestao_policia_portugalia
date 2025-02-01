import {
    ChangeAccountInfoRequestBody,
    ChangePasswordRequestBody,
    LoginRequestBody,
    ValidateTokenRequestBody
} from "@portalseguranca/api-types/account/input";
import { SubmitIssueRequestBody } from "@portalseguranca/api-types/metrics/input";
import {
    CreateOfficerRequestBody,
    DeleteOfficerRequestBody, GetOfficerQueryParams, ListOfficersQueryParams,
    UpdateOfficerRequestBody
} from "@portalseguranca/api-types/officers/input";
import {
    AddOfficerHoursBody,
    AddOfficerJustificationBody,
    ChangeOfficerJustificationBody, ListOfficerHoursQueryParams, ListOfficerJustificationsQueryParams,
    ManageOfficerJustificationBody,
    UpdateOfficerLastShiftBody
} from "@portalseguranca/api-types/officers/activity/input";

import {CreatePatrolBody, ListPatrolsQueryParams} from "@portalseguranca/api-types/patrols/input";
import {Partial, Record} from "runtypes";
import {isQueryParamPresent, ReceivedQueryParams} from "../utils/filters";

export type methodType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteFilterType = {
    [key: string]: {
        queryFunction: (receivedParams: ReceivedQueryParams) => string,
        valueFunction?: (value: any) => any
    }
}

export type routeMethodType = {
    requiresToken: boolean
    requiresForce: boolean
    intents?: string[]
    filters?: RouteFilterType
    queryParams?: {
        type: Record<any, any> | Partial<any, any>,
        schema?: {
            [key: string]: {
                parseFunction: <T>(value: string) => T,
            }
        }
    }
    body?: {
        type: Record<any, any>
    }
    notes?: string
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
    "/accounts/validate-token$": {
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
    "/accounts/login$": {
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

    // Route to logout a user
    "/accounts/logout$": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true
            }
        }
    },

    // Route to change the password of a logged user
    "/accounts/change-password$": {
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
    "/accounts/\\d+/reset-password$": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["accounts"]
            }
        }
    },

    // Route to get the forces of an account
    "/accounts/\\d+/forces$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            }
        }
    },

    // * Routes related to creation and data fetching of existing accounts
    "/accounts/\\d+$": {
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
    "/metrics/issue$": {
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
    "/metrics/suggestion$": {
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
    "/util/patents$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all statuses of a force
    "/util/statuses$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all special units of a force
    "/util/special-units$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all intents of a force
    "/util/intents$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all inactivity types of a force
    "/util/inactivity-types$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    }
}

const officersRoutes: routesType = {
    // Route to get all officers of a force
    "^/officers$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true,
                queryParams: {
                    type: ListOfficersQueryParams,
                },
                filters: {
                    search: {
                        queryFunction: () => `CONCAT(name, callsign, nif, phone, discord) LIKE ?`,
                        valueFunction: (value: string) => `%${value}%`
                    },
                    force: {
                        queryFunction: (receivedParams) => isQueryParamPresent("patrol", receivedParams) && receivedParams["patrol"] === "true" ? '`force` = ?': "",
                        valueFunction: (value: number) => value
                    }
                }
            }
        }
    },

    // * Routes about existing officers or to create new officers
    "/officers/\\d+$": {
        methods: {
            // Route to get an officer's information
            GET: {
                requiresToken: true,
                requiresForce: true,
                queryParams: {
                    type: GetOfficerQueryParams
                },
                notes: "get_officer"
            },

            // Route to create an officer
            PUT: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: CreateOfficerRequestBody
                },
                notes: "add_officer"
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

    // Route to restore a former officer
    "/officers/\\d+/restore$": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                notes: "restore_officer"
            }
        }
    },

    // Route to get the current patrol of an officer
    "/officers/\\d+/patrol$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            }
        }
    }
}

const activityRoutes: routesType = {
    "/officers/\\d+/activity/last-shift$": {
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

    "/officers/\\d+/activity/hours$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true,
                queryParams: {
                    type: ListOfficerHoursQueryParams
                },
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
    "/officers/\\d+/activity/hours/last$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            }
        }
    },
    "/officers/\\d+/activity/hours/\\d+$": {
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
    },

    "/officers/\\d+/activity/justifications$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true,
                queryParams: {
                    type: ListOfficerJustificationsQueryParams
                },
                filters: {
                    "type": {
                        queryFunction: () => `type = ?`,
                        valueFunction: (value: number) => value
                    },
                    "status": {
                        queryFunction: () => `status = ?`,
                        valueFunction: (value: string) => value
                    },
                    "during": {
                        queryFunction: () => `start_date <= ? AND end_date >= ?`,
                        valueFunction: (value: string) => value
                    },
                    "managed": {
                        queryFunction: () => `managed = ?`,
                        valueFunction: (value: number) => value
                    }
                }
            },
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: AddOfficerJustificationBody
                }
            }
        }
    },
    "/officers/\\d+/activity/justifications/active": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            }
        }
    },
    "/officers/\\d+/activity/justifications/\\d+$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            },
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["activity"],
                body: {
                    type: ManageOfficerJustificationBody
                }
            },
            PATCH: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: ChangeOfficerJustificationBody
                }
            },
            DELETE: {
                requiresToken: true,
                requiresForce: true
            }
        }
    }
}

const patrolsRoutes: routesType = {
    "/patrols$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true,
                queryParams: {
                  type: ListPatrolsQueryParams
                },
                filters: {
                    after: {
                        queryFunction: () => `start >= ? OR end >= ?`,
                        valueFunction: (value: string) => [value, value]
                    },
                    before: {
                        queryFunction: () => `end <= ? OR start <= ?`,
                        valueFunction: (value: string) => [value, value]
                    },
                    active: {
                        queryFunction: (receivedParams) => receivedParams["active"] === "true" ? "end IS NULL" : "end IS NOT NULL",
                    },
                    officers: {
                        queryFunction: (receivedParams) => {
                            const arr = receivedParams["officers"].split(",");

                            let query = "";
                            for (let _ = 0; _ < arr.length; _++) {
                                query += `officers LIKE ? AND `;
                            }

                            return query.slice(0, -5);
                        },
                        valueFunction: (value: string) => {
                            return value.split(",").map((element) => `%${element}%`);
                        }
                    }
                }
            },
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: CreatePatrolBody
                }
            }
        }
    },

    "/patrols/[a-z]+\\d+$": {
        methods: {
            GET: {
                requiresToken: true,
                requiresForce: true
            },

            PATCH: {
                requiresToken: true,
                requiresForce: true,
            },

            DELETE: {
                requiresToken: true,
                requiresForce: true,
                intents: ["patrols"]
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
    ...officersRoutes,
    ...patrolsRoutes
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