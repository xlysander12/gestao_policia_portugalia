import assert from "node:assert";

console.log("Loading: db-connector.ts");

import {createPool, Pool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {getDatabaseConnetionDetails, getForceDatabase, getForcesList} from "./config-handler";
type poolsType = {
    [key: string]: Pool
}
let pools: poolsType = {};

// Database configuration
const databaseConfig = getDatabaseConnetionDetails();

// For every force present in the config file, create a pool using the credentials in that same file
for (let force of getForcesList()) {
    let forceDB = getForceDatabase(force);

    let options: PoolOptions = {
        ...databaseConfig,
        database: forceDB,
        connectionLimit: 10
    }

    pools[force] = createPool(options);

    // Test the connection in newly created pool
    pools[force].query("SELECT 1").catch((err) => {
        throw Error(`Error connecting to ${force} database: ${err}`);
    });
}

// Function used by the backend to query the database
export async function queryDB(force: string, query: string, params?: any | any[]): Promise<RowDataPacket[]> {
    // If the force parameter is not set, return
    if (!force || getForcesList().indexOf(force) === -1)
        throw new Error("Force parameter not set or incorrect!");

    // Make sure the params are an array
    if (!Array.isArray(params)) {
        // If it is a single value, convert it to an array
        if (params) params = [params];

        // If it is not set, set it to an empty array
        else params = [];
    }

    let queryResult = await pools[force].query<RowDataPacket[]>(query, params);

    // Make sure the query result is not empty
    assert(queryResult !== undefined, "Query result is empty!");

    return queryResult[0]; // Return only the result of the query and no fields
}