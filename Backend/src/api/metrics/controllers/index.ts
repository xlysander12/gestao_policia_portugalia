import express from "express";
import {APIResponse} from "../../../types";
import {SubmitIssueRequestBodyType, SubmitSuggestionRequestBodyType} from "@portalseguranca/api-types/metrics/input";
import {sendIssue, sendSuggestion} from "../services";

export async function submitIssueController(req: express.Request, res: APIResponse) {
    const {title, body, code} = req.body as SubmitIssueRequestBodyType;

    // Call the service to report the problem
    const result = await sendIssue(res.locals.loggedOfficer, title, body, code);

    // Return the result of the service
    res.status(result.status).json({message: result.message});
}

export async function submitSuggestionController(req: express.Request, res: APIResponse) {
    const {title, body} = req.body as SubmitSuggestionRequestBodyType;

    // Call the service to report the problem
    const result = await sendSuggestion(res.locals.loggedOfficer, title, body);

    // Return the result of the service
    res.status(result.status).json({message: result.message});
}