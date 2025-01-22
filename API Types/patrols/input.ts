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