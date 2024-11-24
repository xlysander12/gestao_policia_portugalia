import {routeMethodType} from "../api/routes";

function buildFiltersQuery(routeMethod: routeMethodType, filters: {name: string, value: any}[], suffix?: {subquery: string, value: any}): {query: string, values: any[]} {
    // Start the query string
    let subqueries: string[] = [];
    let values: any[] = [];

    // Otherwise, iterate over the filters and build the query
    for (const filter of filters) {
        // If the filter doesn't exist in the route, skip it
        if (!routeMethod.filters!.hasOwnProperty(filter.name)) {
            continue;
        }

        // Next, get the filter function
        const filterFunctions = routeMethod.filters![filter.name];

        // Append the result of the filter function to the query
        subqueries.push(filterFunctions.queryFunction());

        // If the filter has a function, run it and append the result to the values array
        if (filterFunctions.valueFunction) {
            let functionResult = filterFunctions.valueFunction(filter.value);
            // If the result is an array, append it to the values array
            if (Array.isArray(functionResult)) {
                values.push(...functionResult);
            } else {
                values.push(functionResult);
            }
        } else {
            values.push(filter.value);
        }
    }

    // Adding the suffix to the query
    if (suffix) {
        subqueries.push(suffix.subquery);
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

// let filters = buildFiltersQuery({
//     requiresToken: true,
//     requiresForce: true,
//     filters: {
//         search: (value: string) => `CONCAT(name, patent, callsign, nif, phone, discord) LIKE '%?%'`
//     }
// }, [{name: "search", value: "test"}]);
//
// console.log(filters);

export default buildFiltersQuery;