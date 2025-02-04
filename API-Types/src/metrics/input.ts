import {Optional, Record, Static, String} from "runtypes";

export const SubmitIssueRequestBody = Record({
    title: String,
    body: String,
    code: Optional(String)
});

export type SubmitIssueRequestBodyType = Static<typeof SubmitIssueRequestBody>

export const SubmitSuggestionRequestBody = Record({
    title: String,
    body: String
});

export type SubmitSuggestionRequestBodyType = Static<typeof SubmitSuggestionRequestBody>;