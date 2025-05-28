import {Partial, Static, String} from "runtypes";

export const ListAnnouncementsQueryParams = Partial({
    active: String.withConstraint(s => s === "true" || s === "false")
});
export type ListAnnouncementsQueryParams = Static<typeof ListAnnouncementsQueryParams>;