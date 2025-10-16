import {
    ChangeAccountInfoRequestBody,
    ChangePasswordRequestBody, LoginDiscordRequestBody,
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
import {FORCE_HEADER} from "../utils/constants";
import {
    AccountInfoAPIResponse, AnnouncementInfoAPIResponse, EventInfoAPIResponse,
    OfficerEvaluationAPIResponse,
    OfficerJustificationAPIResponse,
    PatrolInfoAPIResponse
} from "../types/response-types";
import {SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types";
import {PatrolAddSocket, PatrolDeleteSocket, PatrolUpdateSocket} from "@portalseguranca/api-types/patrols/output";
import {
    CreateEvaluationBody, EditEvaluationBody,
    ListAuthoredEvaluationsQueryParams,
    ListEvaluationsQueryParams
} from "@portalseguranca/api-types/officers/evaluations/input";
import {
    AddEvaluationSocket,
    DeleteEvaluationSocket,
    UpdateEvaluationSocket
} from "@portalseguranca/api-types/officers/evaluations/output";
import {paramsTypes} from "../utils/db-connector";
import {ChangeLastCeremonyRequestBody, ForceTopHoursParams} from "@portalseguranca/api-types/util/input";
import {AccountDeleteSocket, AccountManageSocket, AccountUpdateSocket} from "@portalseguranca/api-types/account/output";
import {
    CreateEventBody, EditEventBody,
    ListEventsQueryParams
} from "@portalseguranca/api-types/events/input";
import {ExistingEventSocket} from "@portalseguranca/api-types/events/output";
import {
    CreateAnnouncementBody,
    EditAnnouncementBody,
    ListAnnouncementsQueryParams
} from "@portalseguranca/api-types/announcements/input";
import {
    AnnouncementAddSocket, AnnouncementDeleteSocket, AnnouncementUpdateSocket
} from "@portalseguranca/api-types/announcements/output";

export type methodType = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteFilterType = Record<string, {
        queryFunction: (receivedParams: ReceivedQueryParams, force: string) => string,
        valueFunction?: (value: string) => paramsTypes | paramsTypes[]
    }>

export interface routeMethodType {
    requiresSession: boolean
    requiresForce: boolean
    intents?: string[]
    filters?: RouteFilterType
    queryParams?: {
        type: RuntypeBase,
        schema?: Record<string, {
                parseFunction: (value: string) => unknown,
            }>
    }
    body?: {
        type: RuntypeBase
    }
    notes?: string,
    broadcast?: {
        event: SOCKET_EVENT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: (req: express.Request, res: any) => SocketResponse,
        patrol?: boolean
    }
}

export interface routeType {
    methods: Partial<Record<methodType, routeMethodType>>
}

export type routesType = Record<string, routeType>;

const accountRoutes: routesType = {
    // Route to validate a token @deprecated - use "/accounts/validate-session"
    "/accounts/validate-token$": {
        methods: {
            POST: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: ValidateTokenRequestBody
                }
            }
        }
    },

    // Route to validate a session
    "/accounts/validate-session$": {
        methods: {
            POST: {
                requiresSession: true,
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
                requiresSession: false,
                requiresForce: false,
                body: {
                    type: LoginRequestBody
                }
            }
        }
    },

    // Route to login a user via discord
    "/accounts/login/discord$": {
        methods: {
            POST: {
                requiresSession: false,
                requiresForce: false,
                body: {
                    type: LoginDiscordRequestBody
                }
            }
        }
    },

    // Route to logout a user
    "/accounts/logout$": {
        methods: {
            POST: {
                requiresSession: true,
                requiresForce: true
            }
        }
    },

    // Route to change the password of a logged user
    "/accounts/change-password$": {
        methods: {
            POST: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: ChangePasswordRequestBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACCOUNTS,
                    body: (_req: express.Request, res: APIResponse): AccountUpdateSocket => {
                        return {
                            action: "update",
                            nif: res.locals.loggedOfficer.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },

    // Route to reset the password of a user
    "/accounts/\\d+/reset-password$": {
        methods: {
            POST: {
                requiresSession: true,
                requiresForce: true,
                intents: ["accounts"],
                broadcast: {
                    event: SOCKET_EVENT.ACCOUNTS,
                    body: (_req: express.Request, res: AccountInfoAPIResponse): AccountUpdateSocket => {
                        return {
                            action: "update",
                            nif: res.locals.targetAccount.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },

    // Route to get the forces of an account
    "/accounts/\\d+/forces$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            }
        }
    },

    // * Routes related to creation and data fetching of existing accounts
    "/accounts/\\d+$": {
        methods: {
            // Route to get information about an account
            GET: {
                requiresSession: true,
                requiresForce: true
            },

            // Route to create an account for an existing officer
            POST: {
                requiresSession: true,
                requiresForce: true,
                intents: ["accounts"]
            },

            // Route to update an account's permissions and suspended state
            PATCH: {
                requiresSession: true,
                requiresForce: true,
                intents: ["accounts"],
                body: {
                    type: ChangeAccountInfoRequestBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACCOUNTS,
                    body: (_req: express.Request, res: AccountInfoAPIResponse): AccountManageSocket => {
                        return {
                            action: "manage",
                            nif: res.locals.targetAccount.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },
            DELETE: {
                requiresSession: true,
                requiresForce: true,
                intents: ["accounts"],
                broadcast: {
                    event: SOCKET_EVENT.ACCOUNTS,
                    body: (_req: express.Request, res: AccountInfoAPIResponse): AccountDeleteSocket => {
                        return {
                            action: "delete",
                            nif: res.locals.targetAccount.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },
}

const metricsRoutes: routesType = {
    // Route to submit an issue
    "/metrics/issue$": {
        methods: {
            POST: {
                requiresSession: true,
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
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: SubmitIssueRequestBody
                }
            }
        }
    },
}

const utilRoutes: routesType = {
    // Route to the colors of a force
    "/util/colors": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all patents of a force
    "/util/patents$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all patent categories of a force
    "/util/patent-categories$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all statuses of a force
    "/util/statuses$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all special units of a force
    "/util/special-units$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all active members of a Special Unit
    "/util/special-units/\\d+/active": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            }
        }
    },

    // Route to get all intents of a force
    "/util/intents$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all inactivity types of a force
    "/util/inactivity-types$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all the patrol types of a force
    "/util/patrol-types$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get the forces that can patrol with given force
    "/util/patrol-forces$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all the evaluation grades of the force
    "/util/evaluation-grades$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all the evaluation fields of the force
    "/util/evaluation-fields$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all the evaluation decisions of the force
    "/util/evaluation-decisions$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get all event types of the force
    "/util/event-types$": {
        methods: {
            GET: {
                requiresSession: false,
                requiresForce: true
            }
        }
    },

    // Route to get and update the last ceremony date of the force
    "/util/last-ceremony$": {
        methods: {
            GET: {
                requiresForce: true,
                requiresSession: false
            },
            PUT: {
                requiresForce: true,
                requiresSession: true,
                intents: ["evaluations"],
                body: {
                    type: ChangeLastCeremonyRequestBody
                }
            }
        }
    },

    // Route to get all notifications for an user
    "/util/notifications$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            }
        }
    },

    // Route to get all errors of a user
    "/util/errors$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            }
        }
    },

    // Route to get the top hours of a force in a week
    "/util/top-hours$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ForceTopHoursParams
                }
            }
        }
    }
}

const officersRoutes: routesType = {
    // Route to get all officers of a force
    "^/officers$": {
        methods: {
            GET: {
                requiresSession: true,
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
                        queryFunction: (receivedParams) => isQueryParamPresent("patrol", receivedParams) && receivedParams.patrol === "true" ? '`officerForce` = ?': "",
                        valueFunction: (value: string) => value
                    },
                    patent: {
                        queryFunction: (receivedParams, force) => {
                            if (!isQueryParamPresent("patrol", receivedParams)) {
                                return "patent = ?";
                            }

                            return `patent = ? AND officerForce = '${force}'`
                        },
                        valueFunction: (value) => value
                    },
                    "patent-category": {
                        queryFunction: (receivedParams, force) => {
                            if (!isQueryParamPresent("patrol", receivedParams)) {
                                return "patentCategory = ?";
                            }

                            return `patentCategory = ? AND officerForce = '${force}'`
                        },
                        valueFunction: (value) => value
                    }
                }
            }
        }
    },

    // Route to import officers from google sheets
    "/officers/import$": {
        methods: {
            POST: {
                requiresSession: true,
                requiresForce: true,
                intents: ["officers"],
                broadcast: {
                    event: SOCKET_EVENT.OFFICERS,
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
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: GetOfficerQueryParams
                },
                notes: "get_officer"
            },

            // Route to create an officer
            PUT: {
                requiresSession: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: CreateOfficerRequestBody
                },
                notes: "add_officer",
                broadcast: {
                    event: SOCKET_EVENT.OFFICERS,
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
                requiresSession: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: UpdateOfficerRequestBody
                },
                broadcast: {
                    event: SOCKET_EVENT.OFFICERS,
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
                requiresSession: true,
                requiresForce: true,
                intents: ["officers"],
                body: {
                    type: DeleteOfficerRequestBody
                },
                broadcast: {
                    event: SOCKET_EVENT.OFFICERS,
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
                requiresSession: true,
                requiresForce: true,
                intents: ["officers"],
                notes: "restore_officer",
                broadcast: {
                    event: SOCKET_EVENT.OFFICERS,
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
                requiresSession: true,
                requiresForce: true
            }
        }
    }
}

const activityRoutes: routesType = {
    "/officers/\\d+/activity/last-shift$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            },
            PUT: {
                requiresSession: true,
                requiresForce: true,
                intents: ["activity"],
                body: {
                    type: UpdateOfficerLastShiftBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ListOfficerHoursQueryParams
                },
                filters: {
                    after: {
                        queryFunction: () => `(week_start >= FROM_UNIXTIME(?) OR week_end >= FROM_UNIXTIME(?))`,
                        valueFunction: (value: string) => [value, value]
                    },
                    before: {
                        queryFunction: () => `(week_end <= FROM_UNIXTIME(?) OR week_start <= FROM_UNIXTIME(?))`,
                        valueFunction: (value: string) => [value, value]
                    }
                }
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                intents: ["activity"],
                body: {
                    type: AddOfficerHoursBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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
                requiresSession: true,
                requiresForce: true
            }
        }
    },
    "/officers/\\d+/activity/hours/\\d+$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            },
            DELETE: {
                requiresSession: true,
                requiresForce: true,
                intents: ["activity"],
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ListOfficerJustificationsQueryParams
                },
                filters: {
                    "type": {
                        queryFunction: () => `type = ?`,
                        valueFunction: (value: string) => parseInt(value)
                    },
                    "status": {
                        queryFunction: () => `status = ?`,
                        valueFunction: (value: string) => value
                    },
                    "during": {
                        queryFunction: () => `start_date <= FROM_UNIXTIME(?) AND end_date >= FROM_UNIXTIME(?)`,
                        valueFunction: (value: string) => value
                    },
                    "managed_by": {
                        queryFunction: () => `managed_by = ?`,
                        valueFunction: (value: string) => parseInt(value)
                    }
                }
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: AddOfficerJustificationBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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
                requiresSession: true,
                requiresForce: true
            }
        }
    },
    "/officers/\\d+/activity/justifications/\\d+$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                intents: ["activity"],
                body: {
                    type: ManageOfficerJustificationBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: ChangeOfficerJustificationBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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
                requiresSession: true,
                requiresForce: true,
                broadcast: {
                    event: SOCKET_EVENT.ACTIVITY,
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

const evaluationsRoutes: routesType = {
    // Route to get the list of and create evaluations where the officer is the target
    "/officers/\\d+/evaluations$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ListEvaluationsQueryParams
                },
                filters: {
                    after: {
                        queryFunction: () => `timestamp >= FROM_UNIXTIME(?)`,
                        valueFunction: (value: string) => value
                    },
                    before: {
                        queryFunction: () => `timestamp <= FROM_UNIXTIME(?)`,
                        valueFunction: (value: string) => value
                    },
                    author: {
                        queryFunction: () => "author = ?",
                        valueFunction: (value: string) => parseInt(value)
                    },
                    withPatrol: {
                        queryFunction: (receivedParams) => receivedParams.withPatrol === "true" ? "patrol IS NOT NULL" : "patrol IS NULL"
                    },
                    patrol: {
                        queryFunction: () => "patrol = ?",
                        valueFunction: (value: string) => parseInt(value)
                    }
                }
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: CreateEvaluationBody
                },
                broadcast: {
                    event: SOCKET_EVENT.EVALUATIONS,
                    body: (_, res: OfficerInfoAPIResponse): AddEvaluationSocket => {
                        return {
                            action: "add",
                            target: res.locals.targetOfficer!.nif,
                            author: res.locals.loggedOfficer.nif,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },

    // Route to get the list of evaluations where the officer is the author
    "/officers/\\d+/evaluations/author": {
        methods: {
            "GET": {
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ListAuthoredEvaluationsQueryParams
                },
                filters: {
                    after: {
                        queryFunction: () => `timestamp >= FROM_UNIXTIME(?)`,
                        valueFunction: (value: string) => value
                    },
                    before: {
                        queryFunction: () => `timestamp <= FROM_UNIXTIME(?)`,
                        valueFunction: (value: string) => value
                    },
                    target: {
                        queryFunction: () => "target = ?",
                        valueFunction: (value: string) => parseInt(value)
                    },
                    withPatrol: {
                        queryFunction: (receivedParams) => receivedParams.withPatrol === "true" ? "patrol IS NOT NULL" : "patrol IS NULL"
                    },
                    patrol: {
                        queryFunction: () => "patrol = ?",
                        valueFunction: (value: string) => parseInt(value)
                    }
                }
            }
        }
    },

    // Route to get the details of, update and delete an evaluation
    "/officers/\\d+/evaluations/\\d+$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            },
            PATCH: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: EditEvaluationBody
                },
                broadcast: {
                    event: SOCKET_EVENT.EVALUATIONS,
                    body: (_, res: OfficerEvaluationAPIResponse): UpdateEvaluationSocket => {
                        return {
                            action: "update",
                            target: res.locals.targetOfficer!.nif,
                            author: res.locals.evaluation.author,
                            id: res.locals.evaluation.id,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },
            DELETE: {
                requiresSession: true,
                requiresForce: true,
                broadcast: {
                    event: SOCKET_EVENT.EVALUATIONS,
                    body: (_, res: OfficerEvaluationAPIResponse): DeleteEvaluationSocket => {
                        return {
                            action: "delete",
                            target: res.locals.targetOfficer!.nif,
                            author: res.locals.evaluation.author,
                            id: res.locals.evaluation.id,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },
}

const patrolsRoutes: routesType = {
    "/patrols$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                  type: ListPatrolsQueryParams
                },
                filters: {
                    after: {
                        queryFunction: () => `(start >= FROM_UNIXTIME(?) OR end >= FROM_UNIXTIME(?))`,
                        valueFunction: (value: string) => [value, value]
                    },
                    before: {
                        queryFunction: () => `(end <= FROM_UNIXTIME(?) OR start <= FROM_UNIXTIME(?))`,
                        valueFunction: (value: string) => [value, value]
                    },
                    active: {
                        queryFunction: (receivedParams) => receivedParams.active === "true" ? "end IS NULL" : "end IS NOT NULL",
                    },
                    officers: {
                        queryFunction: (receivedParams) => {
                            const arr = receivedParams.officers.split(",");

                            let query = "";
                            for (const _ of arr) {
                                query += `officers LIKE ? AND `;
                            }

                            return query.slice(0, -5);
                        },
                        valueFunction: (value: string) => {
                            return value.split(",").map((element) => `%${element}%`);
                        }
                    },
                    type: {
                        queryFunction: (_, force) => `type = ? AND id LIKE '${force}%'`,
                        valueFunction: (value) => value
                    },
                    unit: {
                        queryFunction: (_, force) => `special_unit = ? AND id LIKE '${force}%'`,
                        valueFunction: (value) => value
                    }
                }
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: CreatePatrolBody
                },
                broadcast: {
                    event: SOCKET_EVENT.PATROLS,
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
                requiresSession: true,
                requiresForce: true
            },

            PATCH: {
                requiresSession: true,
                requiresForce: true,
                broadcast: {
                    event: SOCKET_EVENT.PATROLS,
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
                requiresSession: true,
                requiresForce: true,
                intents: ["patrols"],
                broadcast: {
                    event: SOCKET_EVENT.PATROLS,
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

const eventsRoutes: routesType = {
    // Route to get all events in a month
    "/events$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ListEventsQueryParams
                }
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: CreateEventBody
                },
                broadcast: {
                    event: SOCKET_EVENT.EVENTS,
                    body: (_req, res: APIResponse): SocketResponse => {
                        return {
                            action: "add",
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },

    // Route to get the details of a specific event
    "/events/\\D+\\d+$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            },
            PATCH: {
                requiresSession: true,
                requiresForce: true,
                body: {
                    type: EditEventBody
                },
                broadcast: {
                    event: SOCKET_EVENT.EVENTS,
                    body: (_req, res: EventInfoAPIResponse): ExistingEventSocket => {
                        return {
                            action: "update",
                            id: res.locals.event.id,
                            force: res.locals.event.force,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            },
            DELETE: {
                requiresSession: true,
                requiresForce: true,
                broadcast: {
                    event: SOCKET_EVENT.EVENTS,
                    body: (_req, res: EventInfoAPIResponse): ExistingEventSocket => {
                        return {
                            action: "delete",
                            id: res.locals.event.id,
                            force: res.locals.event.force,
                            by: res.locals.loggedOfficer.nif
                        }
                    }
                }
            }
        }
    },
}

const announcementsRoutes: routesType = {
    "/announcements$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true,
                queryParams: {
                    type: ListAnnouncementsQueryParams
                },
                filters: {
                    "active": {
                        queryFunction: (receivedParams) => receivedParams.active === "true" ? "(expiration IS NULL OR expiration > CURRENT_TIMESTAMP())" : "expiration <= CURRENT_TIMESTAMP()",
                    },
                    "tags": {
                        queryFunction: (receivedParams) => {
                            const arr = receivedParams.tags.split(",")

                            let query = "";
                            for (const _ of arr) {
                                query += `tags LIKE ? AND `
                            }

                            return query.slice(0, -5);
                        },
                        valueFunction: (value: string) => {
                            return value.split(",").map(element => `%${element}%`)
                        }
                    }
                }
            },
            POST: {
                requiresSession: true,
                requiresForce: true,
                intents: ["announcements"],
                body: {
                    type: CreateAnnouncementBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ANNOUNCEMENTS,
                    body: (_, res: APIResponse): AnnouncementAddSocket => {
                        return {
                            action: "add",
                            by: res.locals.loggedOfficer.nif
                        }
                    },
                    patrol: true
                }
            }
        }
    },
    "/announcements/[a-z]+\\d+$": {
        methods: {
            GET: {
                requiresSession: true,
                requiresForce: true
            },
            PATCH: {
                requiresSession: true,
                requiresForce: true,
                intents: ["announcements"],
                body: {
                    type: EditAnnouncementBody
                },
                broadcast: {
                    event: SOCKET_EVENT.ANNOUNCEMENTS,
                    body: (_, res: AnnouncementInfoAPIResponse): AnnouncementUpdateSocket => {
                        return {
                            action: "update",
                            id: res.locals.announcement.id,
                            force: res.locals.announcement.force,
                            by: res.locals.loggedOfficer.nif
                        }
                    },
                    patrol: true
                }
            },
            DELETE: {
                requiresSession: true,
                requiresForce: true,
                intents: ["announcements"],
                broadcast: {
                    event: SOCKET_EVENT.ANNOUNCEMENTS,
                    body: (_, res: AnnouncementInfoAPIResponse): AnnouncementDeleteSocket => {
                        return {
                            action: "delete",
                            id: res.locals.announcement.id,
                            force: res.locals.announcement.force,
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
    ...evaluationsRoutes,
    ...officersRoutes,
    ...patrolsRoutes,
    ...eventsRoutes,
    ...announcementsRoutes
}

// ! Make sure there are no routes that require a session but don't require a force.
// ! If there are, throw an error and stop the server from starting
for (const route of Object.keys(routes)) {
    for (const method of Object.keys(routes[route].methods)) {
        if (routes[route].methods[method as methodType]!.requiresSession && !routes[route].methods[method as methodType]!.requiresForce) {
            throw new Error(`Route '${route}' requires a session but doesn't require a force`);
        }
    }
}

export default routes;