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