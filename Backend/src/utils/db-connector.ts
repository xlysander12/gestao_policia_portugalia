import {createPool, Pool, PoolOptions, RowDataPacket} from "mysql2/promise";
import {getDatabaseDetails, getForceDatabase, getForcesList} from "./config-handler";
type poolsType = Record<string, Pool>;
const pools: poolsType = {};

// Database configuration
const {allowed_users, ...databaseConfig} = getDatabaseDetails();

// For every force present in the config file, create a pool using the credentials in that same file
for (const force of getForcesList()) {
    const forceDB = getForceDatabase(force);

    const options: PoolOptions = {
        ...databaseConfig,
        charset: "utf8mb4",
        database: forceDB,
        connectionLimit: 10,
        connectTimeout: 100000,
        supportBigNumbers: true
    }

    pools[force] = createPool(options);

    // Test the connection in newly created pool
    pools[force].query("SELECT 1").catch((err: unknown) => {
        throw Error(`Error connecting to ${force} database: ${err}`);
    });
}

// Function used by the backend to query the database
export type paramsTypes = string | number | bigint | null | Date | undefined;
export async function queryDB(force: string, query: string, params?: paramsTypes | paramsTypes[]): Promise<RowDataPacket[]> {
    // If the force parameter is not set, return
    if (!force || !getForcesList().includes(force))
        throw new Error("Force parameter not set or incorrect! Force: " + force);

    // Make sure the params are an array
    if (!Array.isArray(params)) {
        // If it is a single value, convert it to an array
        if (params !== undefined) params = [params];

        // If it is not set, set it to an empty array
        else params = [];
    }

    const queryResult = await pools[force].query<RowDataPacket[]>(query, params);

    return queryResult[0]; // Return only the result of the query and no fields
}