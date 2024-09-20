import assert from "node:assert";

// TODO: Check if the database connection is working properly before starting the server
console.log("Loading: db-connector.ts");

import {createPool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {FORCES, ForceType} from "./constants";

// Database connection details
const dbConfigDefaultPSP: PoolOptions = {
    host: process.env.PS_MYSQL_HOST,
    user: process.env.PS_MYSQL_USER,
    password: process.env.PS_MYSQL_PASSWORD,
    database: "portugalia_gestao_psp",
    connectionLimit: 10
}

const dbConfigDefaultGNR: PoolOptions = {
    host: process.env.PS_MYSQL_HOST,
    user: process.env.PS_MYSQL_USER,
    password: process.env.PS_MYSQL_PASSWORD,
    database: "portugalia_gestao_gnr",
    connectionLimit: 10
}

// Creating the connection pools
const poolDefaultPSP = createPool(dbConfigDefaultPSP);
const poolDefaultGNR = createPool(dbConfigDefaultGNR);

// Function used by the backend to query the database
export async function queryDB(force: ForceType, query: string, params?: any | any[]): Promise<RowDataPacket[]> {
    // If the force parameter is not set, return
    if (!force || FORCES.indexOf(force) === -1)
        throw new Error("Force parameter not set or incorrect!");

    // Make sure the params are an array
    if (!Array.isArray(params)) {
        // If it is a single value, convert it to an array
        if (params) params = [params];

        // If it is not set, set it to an empty array
        else params = [];
    }

    let queryResult;

    // Switch the connection pool based on the force parameter
    switch (force) {
        case "psp":
            queryResult = await poolDefaultPSP.query<RowDataPacket[]>(query, params);
            break;
        case "gnr":
            queryResult = await poolDefaultGNR.query<RowDataPacket[]>(query, params);
            break;
    }

    // Make sure the query result is not empty
    assert(queryResult !== undefined, "Query result is empty!");

    return queryResult[0]; // Return only the result of the query and no fields
}