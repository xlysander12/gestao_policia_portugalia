import * as rt from "runtypes";

export const ListPatrolsQueryParams = rt.Partial({
    after: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
    before: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
    page: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
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