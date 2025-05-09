import {Array, Null, Number, Optional, Partial, Record, Static, String, Union} from "runtypes";

export const ListEventsQueryParams = Record({
    start: String.withConstraint(s => !isNaN(parseInt(s))),
    end: String.withConstraint(s => !isNaN(parseInt(s)))
});
export type ListEventsQueryParamsType = Static<typeof ListEventsQueryParams>;

export const CreateEventBody = Record({
    type: Number,
    special_unit: Optional(Union(Number, Null)),
    title: Optional(Union(String, Null)),
    description: Optional(Union(String, Null)),
    assignees: Optional(Array(Number)),
    start: Number,
    end: Number
});
export type CreateEventBody = Static<typeof CreateEventBody>;

export const EditEventBody = Partial({
    description: Union(String, Null),
    assignees: Array(Number),
    start: Number,
    end: Number
});
export type EditEventBody = Static<typeof EditEventBody>;