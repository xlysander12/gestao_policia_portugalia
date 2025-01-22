import * as rt from 'runtypes';

export const ListOfficerHoursQueryParams = rt.Partial({
    before: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
        }),
    after: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
});
export type ListOfficerHoursQueryParams = rt.Static<typeof ListOfficerHoursQueryParams>;

export const ListOfficerJustificationsQueryParams = rt.Partial({
    type: rt.Number,
    status: rt.String.withConstraint((string) => {
       return ['pending', 'approved', 'denied'].includes(string);
    }),
    during: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
    managed: rt.Number
});

export const UpdateOfficerLastShiftBody = rt.Record({
   last_shift: rt.String.withConstraint((string) => {
         return !isNaN(Date.parse(string));
   })
});
export type UpdateOfficerLastShiftBodyType = rt.Static<typeof UpdateOfficerLastShiftBody>;

export const AddOfficerHoursBody = rt.Record({
    week_start: rt.String,
    week_end: rt.String,
    minutes: rt.Number
});
export type AddOfficerHoursBodyType = rt.Static<typeof AddOfficerHoursBody>;

export const AddOfficerJustificationBody = rt.Record({
    type: rt.Number,
    start: rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }),
    end: rt.Optional(rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    })),
    description: rt.String
});
export type AddOfficerJusitificationBodyType = rt.Static<typeof AddOfficerJustificationBody>;

export const ManageOfficerJustificationBody = rt.Record({
    approved: rt.Boolean
});
export type ManageOfficerJustificationBodyType = rt.Static<typeof ManageOfficerJustificationBody>;

export const ChangeOfficerJustificationBody = rt.Record({
    type: rt.Optional(rt.Number),
    start: rt.Optional(rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    })),
    end: rt.Optional(rt.Union(rt.String.withConstraint((string) => {
        return !isNaN(Date.parse(string));
    }), rt.Null)),
    description: rt.Optional(rt.String),
});
export type ChangeOfficerJustificationBodyType = rt.Static<typeof ChangeOfficerJustificationBody>;