import * as rt from 'runtypes';

export const ListCeremonyDecisionsQueryParams = rt.Partial({
    before: rt.String.withConstraint(s => !isNaN(parseInt(s))),
    after: rt.String.withConstraint(s => !isNaN(parseInt(s))),
});

export const CreateCeremonyDecisionBody = rt.Record({
    category: rt.Number,
    ceremony: rt.Number,
    decision: rt.Number,
    details: rt.String,
});
export type CreateCeremonyDecisionBody = rt.Static<typeof CreateCeremonyDecisionBody>;