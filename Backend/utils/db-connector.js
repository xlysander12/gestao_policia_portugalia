console.log("Loading: db-connector.js");

const mysql= require("mysql2/promise");

// Database connection details
const dbConfigDefaultPSP = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: "portugalia_gestao_psp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

const dbConfigDefaultGNR = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: "portugalia_gestao_gnr",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

// Creating the connection pools
const poolDefaultPSP = mysql.createPool(dbConfigDefaultPSP);
const poolDefaultGNR = mysql.createPool(dbConfigDefaultGNR);

// Function used by the backend to query the database
async function queryDB(force, query, params) {
    // If the force parameter is not set, return
    if (!force) return;

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
            queryResult = await poolDefaultPSP.query(query, params); // Return only the result of the query and no fields
            break;
        case "gnr":
            queryResult = await poolDefaultGNR.query(query, params);
            break;
        default:
            return;
    }

    return queryResult[0];
}

exports.queryDB = queryDB;