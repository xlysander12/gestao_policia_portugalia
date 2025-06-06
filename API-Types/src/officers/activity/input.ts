import * as rt from 'runtypes';

export const ListOfficerHoursQueryParams = rt.Partial({
    before: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
    after: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
});
export type ListOfficerHoursQueryParams = rt.Static<typeof ListOfficerHoursQueryParams>;

export const ListOfficerJustificationsQueryParams = rt.Partial({
    type: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
    status: rt.String.withConstraint((string) => {
       return ['pending', 'approved', 'denied'].includes(string);
    }),
    during: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    }),
    managed_by: rt.String.withConstraint((string) => {
        return !isNaN(parseInt(string));
    })
});

export const UpdateOfficerLastShiftBody = rt.Record({
   last_shift: rt.Union(rt.Number, rt.Null)
});
export type UpdateOfficerLastShiftBodyType = rt.Static<typeof UpdateOfficerLastShiftBody>;

export const AddOfficerHoursBody = rt.Record({
    week_start: rt.Number,
    week_end: rt.Number,
    minutes: rt.Number
});
export type AddOfficerHoursBodyType = rt.Static<typeof AddOfficerHoursBody>;

export const AddOfficerJustificationBody = rt.Record({
    type: rt.Number,
    start: rt.Number,
    end: rt.Optional(rt.Union(rt.Number, rt.Null)),
    description: rt.String
});
export type AddOfficerJustificationBodyType = rt.Static<typeof AddOfficerJustificationBody>;

export const ManageOfficerJustificationBody = rt.Record({
    approved: rt.Boolean,
    comment: rt.Optional(rt.String)
});
export type ManageOfficerJustificationBodyType = rt.Static<typeof ManageOfficerJustificationBody>;

export const ChangeOfficerJustificationBody = rt.Partial({
    type: rt.Number,
    start: rt.Number,
    end: rt.Union(rt.Number, rt.Null),
    description: rt.String,
    comment: rt.String
});
export type ChangeOfficerJustificationBodyType = rt.Static<typeof ChangeOfficerJustificationBody>;