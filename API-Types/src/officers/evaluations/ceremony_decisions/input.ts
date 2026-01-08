import * as rt from 'runtypes';

export const ListCeremonyDecisionsQueryParams = rt.Partial({
    page: rt.String.withConstraint(s => !isNaN(parseInt(s))),
    before: rt.String.withConstraint(s => !isNaN(parseInt(s))),
    after: rt.String.withConstraint(s => !isNaN(parseInt(s))),
});

export const CreateCeremonyDecisionBody = rt.Record({
    category: rt.Number,
    ceremony_event: rt.Optional(rt.Union(rt.Number, rt.Null)),
    decision: rt.Optional(rt.Union(rt.Number, rt.Null)),
    details: rt.String,
});
export type CreateCeremonyDecisionBody = rt.Static<typeof CreateCeremonyDecisionBody>;

export const EditCeremonyDecisionBody = rt.Partial({
    decision: rt.Number,
    details: rt.String,
});
export type EditCeremonyDecisionBody = rt.Static<typeof EditCeremonyDecisionBody>;