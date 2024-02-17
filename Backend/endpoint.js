// Importing necessary modules
const express = require("express");
const app = express.Router(); // This app is a router to compartimentalize routes
const mysql = require("mysql2/promise");
const path = require("path");

const dotenv = require("dotenv");

// Initialize dotenv
dotenv.config({path: __dirname + "\\.env"});


// Import MySQL connection configurations
const {dbConfigDefaultPSP, dbConfigDefaultGNR} = require("./dbConfigs");

// Create MySQL Pools
const poolDefaultPSP = mysql.createPool(dbConfigDefaultPSP);
const poolDefaultGNR = mysql.createPool(dbConfigDefaultGNR);

// Storing Tokens List
const authenticatedTokens = {"dev": {nif: 668855471, forces: ["psp", "gnr"], lastUsed: "NE"}};

// Forces list
const forces = ["psp", "gnr"];

// React Static
app.use(express.static(path.resolve(__dirname + "/../frontend/build")));

// CSS & JS static
app.use("/cssjs", express.static(path.resolve(__dirname + "/../Frontend-old/"), { extensions: ["js", "css"] }));

/************************************
 * Database Functions *
 ***********************************/
async function queryDB(force, query) {
    switch (force) {
        case "psp":
            return await poolDefaultPSP.query(query);
        case "gnr":
            return await poolDefaultGNR.query(query);
        default:
            return;
    }
}

/************************************
 * Token / Authentication Functions *
 ***********************************/

async function generateToken(nif) {
    // Before generating a token, making sure the user doesn't have any tokens already, and if it does, delete them
    for (const force in forces) {
        await queryDB(force, `DELETE FROM tokens WHERE nif = ${nif}`)
    }

    // Repeat the generation process until an unique token is generated
    let unique = false;
    let token = "";
    while (!unique) {
        // Generate a random token
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        // After generating the token, check if it already exists
        let [rows, fields] = await queryDB("psp", `SELECT * FROM tokens WHERE token = ${token}`);
        if (rows.length !== 0) {
            continue;
        }

        [rows, fields] = await queryDB("gnr", `SELECT * FROM tokens WHERE token = ${token}`);
        if (rows.length !== 0) {
            continue;
        }

        // If it doesn't exist, exit out of the loop
        unique = true;
    }

    // Return the token
    return token;
}

async function checkTokenValidityIntents(token, force, intent) {
    // Check if the token is present
    if (token === undefined) {
        return [false, 401, "Não foi fornecido um token de autenticação."];
    }

    // Making sure force is specified
    if (force === undefined) {
        return [false, 400, "Não foi fornecida uma força para a validação do token."];
    }

    // Querying the Database to check if the token exists
    let [rows, fields] = await queryDB(force, `SELECT nif FROM tokens WHERE token = ${token}`);
    if (rows.length === 0) {
        return [false, 401, "O token fornecido não é válido."];
    }

    // Store the nif the token points to
    let nif = rows[0].nif;

    // Once it has been confirmed the token exists, the lastUsed field should be updated in all databases
    // It's used the `then()` method to avoid waiting for the query to finish since the result is not needed
    for (const forcesKey in forces) {
        queryDB(forcesKey, `UPDATE tokens SET ultimouso = CURRENT_TIMESTAMP() WHERE token = ${token}`).then(_ => {});
    }

    // If intent is null, then the user doesn't need special permissions
    if (intent === null || intent === undefined) {
        return [true, 0]; // Since the return was true, no HTTT Status Code is needed
    }

    // Fetch from the database the intents json of the user
    [rows, fields] = await queryDB(force, `SELECT intents FROM usuarios WHERE nif = ${nif}`);

    // Converting the row to a JSON object
    let userIntents = JSON.parse(rows[0].intents);

    // Check if the user has the intent
    try {
        if (!userIntents[intent]) {
            return [false, 403, "Não tens permissão para realizar esta ação"];
        }
    } catch {
        return [false, 400, "Permissões inválidas"];
    }


    return [true, 200];
}

/********************************
 * Routes to serve the frontend [DEPRECATED]*
 *******************************/
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../Frontend-old/home/index.html"));
});

// Setting up the default login page route
app.get("/login", (req, res) => {
    res.sendFile(path.resolve(__dirname + "/../Frontend-old/login/index.html"));
});


/***************
 * API Routes *
 *************/

/**
 * Util Endpoints
 */

app.get("/api/util/patents", async (req, res) => {
    // Get what force the user is trying to get the patents from
    let force = req.headers["x-portalseguranca-force"];

    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

    // Get the list from the database
    const [rows, fields] = await queryDB(force, `SELECT * FROM patentes`);

    // Send the list to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows
    });
});


app.get("/api/util/statuses", async (req, res) => {
    // Get the list from the database
    const [rows, fields] = await poolDefaultPSP.query(`SELECT * FROM status`);

    // Send the list to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows
    });
});

/**
 * Token Endpoints
 **/

app.post("/api/validateToken", async (req, res) => {
    let validation = await checkTokenValidityIntents(req.headers.authorization, req.headers["x-portalseguranca-force"], req.body.intent);

    if (!validation[0]) {
        res.status(validation[1]).json({
            message: validation[2]
        });
        return;
    }

    // If everything is correct, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida",
        data: authenticatedTokens[req.headers.authorization].nif
    });
});

/**
 * Login endpoint
 **/

// Post Endpoint to login
// TODO: Re-do this endpoint. There is code repetition
// TODO: The login endpoint needs to check which force the user belongs to or even all of them
app.post("/api/login", async (req, res) => {
    // Check if the request has the correct body
    if (!req.body.nif || !req.body.password) {
        res.status(400).json({
            message: "Não foi fornecido um username ou password",
        });
        return;
    }

    // Check if the user exists (it's needed to check on all forces databases)
    let found_results = [];

    // Getting the row corresponding the nif and adding it to the found_results array
    for (const force in forces) {
        const [rows, fields] = await queryDB(force, `SELECT password FROM usuarios WHERE nif = ${req.body.nif}`);
        found_results.push(...rows);
    }

    // If the found_results array is empty, then the username doesn't exist
    if (found_results.length === 0) {
        res.status(401).json({
            message: "O username fornecido não existe."
        });
        return;
    }

    let valid_login;

    // If the password is NULL, then the correct password would be "seguranca"
    if (found_results[0].password === null) {
        valid_login = req.body.password === "seguranca";
    } else {
        // If the password is not NULL, check if it is correct
        valid_login = rows[0].password === req.body.password; // TODO: Hash password
    }


    // If the password is incorrect, return a 401 status code
    if (!valid_login) {
        res.status(401).json({
            message: "Password incorreta"
        });
        return;
    }

    // If everything is correct, generate a token
    const token = generateToken(req.body.nif);

    // After generating the token, store it in the databases of the forces the user belongs to
    for (const force in forces) {
        await queryDB(force, `INSERT INTO tokens (token, nif) SELECT "${token}", ${req.body.nif} FROM dual WHERE EXISTS ( SELECT 1 FROM usuarios WHERE nif = ${req.body.nif})`);
    }

    // Send the token to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: token
    });
});

// Patch Endpoint to change password
app.patch("/api/login", (req, res) => {
    // TODO: Implement this endpoint
});

/**
 * Officer Information endpoint
 **/
app.get("/api/officerInfo", async (req, res) => {
    // Check if user is authenticated
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization, req.headers["x-portalseguranca-force"]);
    if (!authenticatedPermission[0]) {
        res.status(authenticatedPermission[1]).json({
            message: authenticatedPermission[2]
        });
        return;
    }

    // If there's no search defined, replace with empty string
    if (req.query.search === undefined) {
        req.query.search = "";
    }

    const [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT nome, patente, callsign, status, nif FROM efetivosV WHERE CONCAT(nome, patente, callsign, nif, telemovel, discord) LIKE "%${req.query.search}%"`);
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows
    });
});

app.get("/api/officerInfo/:nif", async (req, res) => {
    // Check if user is authenticated
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization, req.headers["x-portalseguranca-force"]);
    if (!authenticatedPermission[0]) {
        res.status(authenticatedPermission[1]).json({
            message: authenticatedPermission[2]
        });
        return;
    }

    const [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT * FROM ${req.headers.raw === "true" ? "efetivos" : "efetivosV"} WHERE nif = ${req.params.nif}`);

    if (rows.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows[0]
    });
});

module.exports = app;