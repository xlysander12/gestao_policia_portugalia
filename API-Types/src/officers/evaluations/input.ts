import {Dictionary, Number, Optional, Partial, Record, String, Static} from "runtypes";

export const ListEvaluationsQueryParams = Partial({
    page: String.withConstraint(string => !isNaN(parseInt(string))),
    after: String.withConstraint(string => !isNaN(parseInt(string))),
    before: String.withConstraint(string => !isNaN(parseInt(string))),
    author: String.withConstraint(string => !isNaN(parseInt(string))),
    withPatrol: String.withConstraint(string => string === "true" || string === "false"),
    patrol: String.withConstraint(string => !isNaN(parseInt(string))),
});

export const ListAuthoredEvaluationsQueryParams = Partial({
    page: String.withConstraint(string => !isNaN(parseInt(string))),
    after: String.withConstraint(string => !isNaN(parseInt(string))),
    before: String.withConstraint(string => !isNaN(parseInt(string))),
    target: String.withConstraint(string => !isNaN(parseInt(string))),
    withPatrol: String.withConstraint(string => string === "true" || string === "false"),
    patrol: String.withConstraint(string => !isNaN(parseInt(string))),
});

export const EvaluationBodyFields = Dictionary(Number, String.withConstraint(string => !isNaN(parseInt(string))));

export type EvaluationBodyFieldsType = Static<typeof EvaluationBodyFields>

export const CreateEvaluationBody = Record({
    patrol: Optional(Number),
    comments: Optional(String),
    decision: Optional(Number),
    timestamp: Optional(Number),
    fields: EvaluationBodyFields.withConstraint(fields => Object.keys(fields).length > 0)
});

export type CreateEvaluationBodyType = Static<typeof CreateEvaluationBody>

export const EditEvaluationBody = Partial({
    patrol: Number,
    comments: String,
    decision: Number,
    timestamp: Number,
    fields: EvaluationBodyFields.withConstraint(fields => Object.keys(fields).length > 0)
});

export type EditEvaluationBodyType = Static<typeof EditEvaluationBody>