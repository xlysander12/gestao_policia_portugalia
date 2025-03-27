import {RouteFilterType} from "../api/routes";

export type Filters = {
    query: string,
    values: any[]
}
function buildFiltersQuery(routeValidFilters: RouteFilterType, queryParams: ReceivedQueryParams = {}, suffix?: {subquery: string, value: any}): Filters {
    // Start the query string
    let subqueries: string[] = [];
    let values: any[] = [];

    // Otherwise, iterate over the queryParams and build the query
    for (const param of Object.keys(queryParams)) {
        // If the filter doesn't exist in the route, skip it
        if (!routeValidFilters!.hasOwnProperty(param)) {
            continue;
        }

        // Next, get the filter function
        const filterFunctions = routeValidFilters![param];

        // Append the result of the filter function to the query
        const query = filterFunctions.queryFunction(queryParams);
        if (query === "") {
            continue;
        }
        subqueries.push(filterFunctions.queryFunction(queryParams));

        // If the filter has a function, run it and append the result to the values array
        if (filterFunctions.valueFunction) {
            let functionResult = filterFunctions.valueFunction(queryParams[param]);
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
    let query = subqueries.join(" AND ");

    return {query: `WHERE ${query}`, values: values};
}

export type ReceivedQueryParams = { [name: string]: string }
export function requestQueryToReceivedQueryParams(query: any): ReceivedQueryParams {
    let filters: ReceivedQueryParams = {};
    for (const queryName in query) {
        filters[queryName] = query[queryName];
    }

    return filters;
}

export function isQueryParamPresent(name: string, queryParms: ReceivedQueryParams): boolean {
    if (!queryParms) return false;
    return queryParms.hasOwnProperty(name);
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