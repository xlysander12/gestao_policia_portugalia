import * as rt from "runtypes";

const DatabaseType = rt.Record({
    host: rt.String,
    port: rt.Number,
    user: rt.String,
    password: rt.String
});

const ForceHubRt = rt.Record({
    id: rt.String,
    sheetName: rt.String,
    ranges: rt.Record({
        patents: rt.Dictionary(rt.Union(rt.Record({
            start: rt.Number,
            end: rt.Number
        }), rt.Array(rt.Record({
            start: rt.Number,
            end: rt.Number
        }))), rt.String.withConstraint((s) => !isNaN(parseInt(s)))),
        inactive: rt.Record({
            start: rt.Number,
            end: rt.Number
        }),
        properties: rt.Dictionary(rt.Number, rt.String)
    }),
});

const ForceRt = rt.Record({
    name: rt.String,
    acronym: rt.String,
    patrols: rt.Array(rt.String),
    database: rt.String,
    isPromotion: rt.String,
    maximum_non_working_days: rt.Number,
    minimum_week_minutes: rt.Number,
    hub: rt.Optional(ForceHubRt)
});

const ForcesRt = rt.Dictionary(ForceRt, rt.String);

export const ConfigTypes = rt.Record({ database: DatabaseType, forces: ForcesRt });

export type StaticConfigTypes = rt.Static<typeof ConfigTypes>