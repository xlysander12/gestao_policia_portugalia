import * as rt from "runtypes";

const DatabaseRt = rt.Record({
  host: rt.String,
  port: rt.Number,
  user: rt.String,
  password: rt.String,
  database: rt.String
});

const ForceRt = rt.Record({
  name: rt.String,
  acronym: rt.String,
  patrols: rt.Array(rt.String),
  database: DatabaseRt,
});

const ForcesRt = rt.Dictionary(ForceRt, rt.String);

export const ConfigTypes = rt.Record({ forces: ForcesRt });

export type StaticConfigTypes = rt.Static<typeof ConfigTypes>