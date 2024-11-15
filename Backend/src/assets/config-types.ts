import * as rt from "runtypes";

const DatabaseType = rt.Record({
  host: rt.String,
  port: rt.Number,
  user: rt.String,
  password: rt.String
});

const ForceRt = rt.Record({
  name: rt.String,
  acronym: rt.String,
  patrols: rt.Array(rt.String),
  database: rt.String
});

const ForcesRt = rt.Dictionary(ForceRt, rt.String);

export const ConfigTypes = rt.Record({ database: DatabaseType, forces: ForcesRt });

export type StaticConfigTypes = rt.Static<typeof ConfigTypes>