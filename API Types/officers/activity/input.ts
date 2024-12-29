import * as rt from 'runtypes';

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