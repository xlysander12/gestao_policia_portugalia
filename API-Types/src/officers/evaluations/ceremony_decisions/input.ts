import * as rt from 'runtypes';

export const ListCeremonyDecisionsQueryParams = rt.Partial({
    before: rt.String.withConstraint(s => !isNaN(parseInt(s))),
    after: rt.String.withConstraint(s => !isNaN(parseInt(s))),
});