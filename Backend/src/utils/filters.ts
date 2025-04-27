import {RouteFilterType} from "../api/routes";
import {paramsTypes} from "./db-connector";
import QueryString from "qs";

export interface Filters {
    query: string,
    values: paramsTypes[]
}
function buildFiltersQuery(routeValidFilters: RouteFilterType, queryParams: ReceivedQueryParams = {}, suffix?: {subquery: string, value: paramsTypes | paramsTypes[]}): Filters {
    // Start the query string
    const subqueries: string[] = [];
    const values: paramsTypes[] = [];

    // Otherwise, iterate over the queryParams and build the query
    for (const param of Object.keys(queryParams)) {
        // If the filter doesn't exist in the route, skip it
        if (!Object.prototype.hasOwnProperty.call(routeValidFilters, param)) {
            continue;
        }

        // Next, get the filter function
        const filterFunctions = routeValidFilters[param];

        // Append the result of the filter function to the query
        const query = filterFunctions.queryFunction(queryParams);
        if (query === "") {
            continue;
        }
        subqueries.push(filterFunctions.queryFunction(queryParams));

        // If the filter has a function, run it and append the result to the values array
        if (filterFunctions.valueFunction) {
            const functionResult = filterFunctions.valueFunction(queryParams[param]);
            // If the result is an array, append it to the values array
            if (Array.isArray(functionResult)) {
                values.push(...functionResult);
            } else {
                values.push(functionResult);
            }
        }
    }

    // Adding the suffix to the query
    if (suffix) {
        subqueries.push(suffix.subquery);

        // Checking if the value of the suffix is an array or not
        if (Array.isArray(suffix.value))
            values.push(...suffix.value);
        else
            values.push(suffix.value);
    }

    // If there are no subqueries, return an empty string
    if (subqueries.length === 0) {
        return {query: "", values: []};
    }

    // Build the query string
    const query = subqueries.join(" AND ");

    return {query: `WHERE ${query}`, values: values};
}

export type ReceivedQueryParams = Record<string, string>;
export function requestQueryToReceivedQueryParams(query: QueryString.ParsedQs): ReceivedQueryParams {
    const filters: ReceivedQueryParams = {};
    for (const queryName in query) {
        filters[queryName] = query[queryName] as string;
    }

    return filters;
}

export function isQueryParamPresent(name: string, queryParms: ReceivedQueryParams | null | undefined): boolean {
    if (!queryParms) return false;
    return Object.prototype.hasOwnProperty.call(queryParms, name);
}
// let filters = buildFiltersQuery({
//     requiresToken: true,
//     requiresForce: true,
//     filters: {
//         search: (value: string) => `CONCAT(name, patent, callsign, nif, phone, discord) LIKE '%?%'`
//     }
// }, [{name: "search", value: "tests"}]);
//
// console.log(filters);

export default buildFiltersQuery;