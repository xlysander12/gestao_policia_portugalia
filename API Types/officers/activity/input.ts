import * as rt from 'runtypes';

export const UpdateOfficerLastShiftBody = rt.Record({
   last_shift: rt.String.withConstraint((string) => {
         return !isNaN(Date.parse(string));
   })
});

export type UpdateOfficerLastShiftBodyType = rt.Static<typeof UpdateOfficerLastShiftBody>;