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
import {
    OfficerAddSocket,
    OfficerUpdateSocket,
    OfficerRestoreSocket,
    OfficerDeleteSocket,
    OfficerImportSocket
} from "@portalseguranca/api-types/officers/output";
import {OfficerLastShiftSocket, OfficerAddHoursSocket, OfficerDeleteHoursSocket, OfficerAddJustificationSocket, OfficerUpdateJustificationSocket, OfficerManageJustificationSocket, OfficerDeleteJustificationSocket} from "@portalseguranca/api-types/officers/activity/output";
import {CreatePatrolBody, ListPatrolsQueryParams} from "@portalseguranca/api-types/patrols/input";
import {isQueryParamPresent, ReceivedQueryParams} from "../utils/filters";
import {RuntypeBase} from "runtypes/lib/runtype";
import express from "express";
import {APIResponse, OfficerInfoAPIResponse} from "../types";
import {FORCE_HEADER, UPDATE_EVENTS} from "../utils/constants";
import {OfficerJustificationAPIResponse, PatrolInfoAPIResponse} from "../types/response-types";
import {SocketResponse} from "@portalseguranca/api-types";
import {PatrolAddSocket, PatrolDeleteSocket, PatrolUpdateSocket} from "@portalseguranca/api-types/patrols/output";

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
        type: RuntypeBase,
        schema?: {
            [key: string]: {
                parseFunction: <T>(value: string) => T,
            }
        }
    }
    body?: {
        type: RuntypeBase
    }
    notes?: string,
    broadcast?: {
        event: string,
        body: (req: express.Request, res: any) => SocketResponse,
        patrol?: boolean
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
    },

    // Route to get all the patrol types of a force
    "/util/patrol-types$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get the forces that can patrol with given force
    "/util/patrol-forces$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all the evaluation grades of the force
    "/util/evaluation-grades$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all the evaluation fields of the force
    "/util/evaluation-fields$": {
        methods: {
            GET: {
                requiresToken: false,
                requiresForce: true
            }
        }
    },

    // Route to get all notifications for an user
    "/util/notifications$": {
        methods: {
            GET: {
                requiresToken: true,
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
                        queryFunction: (receivedParams) => isQueryParamPresent("patrol", receivedParams) && receivedParams["patrol"] === "true" ? '`officerForce` = ?': "",
                        valueFunction: (value: number) => value
                    }
                }
            }
        }
    },

    // Route to import officers from google sheets
    "/officers/import$": {
        methods: {
            POST: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                broadcast: {
                    event: UPDATE_EVENTS.OFFICER,
                    body: (_req: express.Request, res: APIResponse): OfficerImportSocket => {
                        return {
                            action: "update",
                            nif: 0,
                            by: res.locals.loggedOfficer.nif
                        }
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
                notes: "add_officer",
                broadcast: {
                    event: UPDATE_EVENTS.OFFICER,
                    body: (req: express.Request, res: APIResponse): OfficerAddSocket => {
                        return {
                            action: "add",
                            nif: parseInt(req.params.nif),
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },

            // Route to update an officer's information
            PATCH: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: UpdateOfficerRequestBody
                },
                broadcast: {
                    event: UPDATE_EVENTS.OFFICER,
                    body: (_req: express.Request, res: OfficerInfoAPIResponse): OfficerUpdateSocket => {
                        return {
                            action: "update",
                            nif: res.locals.targetOfficer!.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },

            // Route to delete an officer
            DELETE: {
                requiresToken: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: DeleteOfficerRequestBody
                },
                broadcast: {
                    event: UPDATE_EVENTS.OFFICER,
                    body: (_req: express.Request, res: OfficerInfoAPIResponse): OfficerDeleteSocket => {
                        return {
                            action: "delete",
                            nif: res.locals.targetOfficer!.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
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
                notes: "restore_officer",
                broadcast: {
                    event: UPDATE_EVENTS.OFFICER,
                    body: (req: express.Request, res: OfficerInfoAPIResponse): OfficerRestoreSocket => {
                        return {
                            action: "restore",
                            nif: parseInt(req.params.nif),
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
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
                },
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (_req: express.Request, res: OfficerInfoAPIResponse): OfficerLastShiftSocket => {
                        return {
                            type: "last_shift",
                            action: "update",
                            nif: res.locals.targetOfficer!.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
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
                },
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (_req, res: OfficerInfoAPIResponse): OfficerAddHoursSocket => {
                        return {
                            type: "hours",
                            action: "add",
                            nif: res.locals.targetOfficer!.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
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
                intents: ["activity"],
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (req, res: OfficerInfoAPIResponse): OfficerDeleteHoursSocket => {
                        return {
                            type: "hours",
                            action: "delete",
                            nif: res.locals.targetOfficer!.nif,
                            id: parseInt(req.params.id),
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
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
                },
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (_req, res: OfficerInfoAPIResponse): OfficerAddJustificationSocket => {
                        return {
                            type: "justification",
                            action: "add",
                            nif: res.locals.targetOfficer!.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
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
                },
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (_req, res: OfficerJustificationAPIResponse): OfficerManageJustificationSocket => {
                        return {
                            type: "justification",
                            action: "manage",
                            nif: res.locals.targetOfficer!.nif,
                            id: res.locals.justification.id,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },
            PATCH: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: ChangeOfficerJustificationBody
                },
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (_req, res: OfficerJustificationAPIResponse): OfficerUpdateJustificationSocket => {
                        return {
                            type: "justification",
                            action: "update",
                            nif: res.locals.targetOfficer!.nif,
                            id: res.locals.justification.id,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },
            DELETE: {
                requiresToken: true,
                requiresForce: true,
                broadcast: {
                    event: UPDATE_EVENTS.ACTIVITY,
                    body: (_req, res: OfficerJustificationAPIResponse): OfficerDeleteJustificationSocket => {
                        return {
                            type: "justification",
                            action: "delete",
                            nif: res.locals.targetOfficer!.nif,
                            id: res.locals.justification.id,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
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
                    },
                    type: {
                        queryFunction: () => `type = ?`,
                        valueFunction: (value: number) => value
                    },
                    unit: {
                        queryFunction: () => `special_unit = ?`,
                        valueFunction: (value: number) => value
                    }
                }
            },
            POST: {
                requiresToken: true,
                requiresForce: true,
                body: {
                    type: CreatePatrolBody
                },
                broadcast: {
                    event: UPDATE_EVENTS.PATROL,
                    body: (req, res: APIResponse): PatrolAddSocket => {
                        return {
                            action: "add",
                            force: req.header(FORCE_HEADER)!,
                            by: res.locals.loggedOfficer.nif
                        }
                    },
                    patrol: true
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
                broadcast: {
                    event: UPDATE_EVENTS.PATROL,
                    body: (_req, res: PatrolInfoAPIResponse): PatrolUpdateSocket => {
                        return {
                            action: "update",
                            id: res.locals.patrol.id,
                            force: res.locals.patrol.force,
                            by: res.locals.loggedOfficer.nif
                        }
                    },
                    patrol: true
                }
            },

            DELETE: {
                requiresToken: true,
                requiresForce: true,
                intents: ["patrols"],
                broadcast: {
                    event: UPDATE_EVENTS.PATROL,
                    body: (_req, res: PatrolInfoAPIResponse): PatrolDeleteSocket => {
                        return {
                            action: "delete",
                            id: res.locals.patrol.id,
                            force: res.locals.patrol.force,
                            by: res.locals.loggedOfficer.nif
                        }
                    },
                    patrol: true
                }
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
    for (const method of Object.keys(routes[route].methods)) {
        if (routes[route].methods[method as methodType]!.requiresToken && !routes[route].methods[method as methodType]!.requiresForce) {
            throw new Error(`Route '${route}' requires a token but doesn't require a force`);
        }
    }
}

export default routes;