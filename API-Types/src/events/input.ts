import {Record, Static, String} from "runtypes";

export const ListEventsQueryParams = Record({
    month: String.withConstraint(s => !isNaN(parseInt(s)))
});
export type ListEventsQueryParamsType = Static<typeof ListEventsQueryParams>;