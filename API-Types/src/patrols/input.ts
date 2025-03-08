import * as rt from "runtypes";

export const ListPatrolsQueryParams = rt.Partial({
    after: rt.String.withConstraint(string => !isNaN(Date.parse(string))),
    before: rt.String.withConstraint(string => !isNaN(Date.parse(string))),
    active: rt.String.withConstraint(string => string === "true" || string === "false"),
    officers: rt.String.withConstraint(string => {
            if (!Array.isArray(string.split(","))) return false;

            const arr = string.split(",");
            for (const element of arr) {
                if (isNaN(parseInt(element))) return false;
            }

            return true;
    }),
    page: rt.String.withConstraint(string => !isNaN(parseInt(string))),
});
export type ListPatrolsQueryParams = rt.Static<typeof ListPatrolsQueryParams>;

export const CreatePatrolBody = rt.Record({
    type: rt.Number,
    special_unit: rt.Optional(rt.Number),
    officers: rt.Array(rt.Number),
    start: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
    end: rt.Optional(rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    })),
    notes: rt.Optional(rt.String)
});
export type CreatePatrolBody = rt.Static<typeof CreatePatrolBody>;

export const EditPatrolBody = rt.Partial({
    start: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
    end: rt.Union(rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }), rt.Null),
    officers: rt.Array(rt.Number),
    notes: rt.Union(rt.String, rt.Null)
});
export type EditPatrolBody = rt.Static<typeof EditPatrolBody>;