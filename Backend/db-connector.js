const mysql= require("mysql2/promise");

// Database connection details
let dbConfigDefaultPSP = {
    host: "mysql.crunchypi.xyz",
    user: "portugalia_gestao_policia",
    password: process.env.MYSQL_PASSWORD,
    database: "portugalia_gestao_psp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

let dbConfigDefaultGNR = {
    host: "mysql.crunchypi.xyz",
    user: "portugalia_gestao_policia",
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
async function queryDB(force, query) {
    switch (force) {
        case "psp":
            return poolDefaultPSP.query(query);
        case "gnr":
            return poolDefaultGNR.query(query);
        default:
            return;
    }
}

exports.queryDB = queryDB;