import {Partial, Record, Static, String, Array, Union, Number, Null} from "runtypes";

export const ListAnnouncementsQueryParams = Partial({
    active: String.withConstraint(s => s === "true" || s === "false"),
    tags: String
});
export type ListAnnouncementsQueryParams = Static<typeof ListAnnouncementsQueryParams>;

export const CreateAnnouncementBody = Record({
    forces: Array(String),
    tags: Array(String),
    expiration: Union(Number, Null),
    title: String,
    body: String
});
export type CreateAnnouncementBody = Static<typeof CreateAnnouncementBody>;