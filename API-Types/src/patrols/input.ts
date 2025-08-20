import * as rt from "runtypes";

export const ListPatrolsQueryParams = rt.Partial({
    after: rt.String.withConstraint(string => /^\d+$/.test(string)),
    before: rt.String.withConstraint(string => /^\d+$/.test(string)),
    active: rt.String.withConstraint(string => string === "true" || string === "false"),
    officers: rt.String.withConstraint(string => {
            if (!Array.isArray(string.split(","))) return false;

            const arr = string.split(",");
            for (const element of arr) {
                if (isNaN(parseInt(element))) return false;
            }

            return true;
    }),
    type: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
    unit: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
    page: rt.String.withConstraint(string => !isNaN(parseInt(string))),
});
export type ListPatrolsQueryParams = rt.Static<typeof ListPatrolsQueryParams>;

export const CreatePatrolBody = rt.Record({
    type: rt.Number,
    special_unit: rt.Optional(rt.Number),
    officers: rt.Array(rt.Number),
    start: rt.Union(rt.Number, rt.Literal("now")),
    end: rt.Optional(rt.Union(rt.Number, rt.Literal("now"))),
    notes: rt.Optional(rt.String)
});
export type CreatePatrolBody = rt.Static<typeof CreatePatrolBody>;

export const EditPatrolBody = rt.Partial({
    start: rt.Union(rt.Number, rt.Literal("now")),
    end: rt.Union(rt.Union(rt.Number, rt.Literal("now")), rt.Null),
    officers: rt.Array(rt.Number),
    notes: rt.Union(rt.String, rt.Null)
});
export type EditPatrolBody = rt.Static<typeof EditPatrolBody>;