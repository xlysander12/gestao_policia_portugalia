import {Partial, String} from "runtypes";

export const ListEvaluationsQueryParams = Partial({
    after: String.withConstraint(string => !isNaN(Date.parse(string))),
    before: String.withConstraint(string => !isNaN(Date.parse(string))),
    author: String.withConstraint(string => !isNaN(parseInt(string))),
    withPatrol: String.withConstraint(string => string === "true" || string === "false"),
    patrol: String.withConstraint(string => !isNaN(parseInt(string))),
});