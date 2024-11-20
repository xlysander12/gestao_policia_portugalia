import {routeMethodType} from "../api/routes";

function buildFiltersQuery(routeMethod: routeMethodType, filters: {name: string, value: any}[]): {query: string, values: any[]} {
    // If the route doesn't have any filters, return an empty string
    if (!routeMethod.filters) {
        return {query: "", values: []};
    }

    // Start the query string
    let subqueries: string[] = [];
    let values: any[] = [];

    // Otherwise, iterate over the filters and build the query
    for (const filter of filters) {
        // If the filter doesn't exist in the route, skip it
        if (!routeMethod.filters.hasOwnProperty(filter.name)) {
            continue;
        }

        // Next, get the filter function
        const filterFunctions = routeMethod.filters[filter.name];

        // Append the result of the filter function to the query
        subqueries.push(filterFunctions.queryFunction());

        // Add the value to the values array
        // If the route doens't have a value function, just add the value
        if (filterFunctions.valueFunction) {
            values.push(filterFunctions.valueFunction(filter.value));
        } else {
            values.push(filter.value);
        }
    }

    let query = subqueries.join(" AND ");

    // If there are no subqueries, return an empty string
    if (query === "") {
        return {query: "", values: []};
    }

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