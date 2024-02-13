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

// React Static
app.use(express.static(path.resolve(__dirname + "/../frontend/build")));

// CSS & JS static
app.use("/cssjs", express.static(path.resolve(__dirname + "/../Frontend-old/"), { extensions: ["js", "css"] }));

/************************************
 * Token / Authentication Functions *
 ***********************************/

function generateToken(username) {
    // Before generating a token, seek and revoke all tokens from the user
    for (let token in authenticatedTokens) {
        if (authenticatedTokens[token] === username) {
            delete authenticatedTokens[token];
        }
    }

    // Generate a random token
    let token = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 32; i++) {
        token += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    // After generating the token, check if it already exists
    if (authenticatedTokens[token]) {
        // If it already exists, generate another one
        return generateToken();
    }

    // If it doesn't exist, store it in authenticatedTokens and return it
    authenticatedTokens[token] = username;
    return token;
}

async function checkTokenValidityIntents(token, force, intent) {
    // Check if the token is present
    if (token === undefined) {
        return [false, 401, "Não foi fornecido um token de autenticação."];
    }

    // Check if the token exists
    if (!authenticatedTokens[token]) {
        return [false, 401, "O token fornecido é inválido."];
    }

    // Making sure force is specified
    if (force === undefined) {
        return [false, 400, "Não foi fornecida uma força para a validação do token."];
    }

    // Check if the user has the force
    if (authenticatedTokens[token].forces.indexOf(force) === -1) {
        return [false, 403, "Não tens permissão para acessar a dados desta força"];
    }

    // If intent is null, then the user doesn't need special permissions
    if (intent === null || intent === undefined) {
        return [true, 0]; // Since the return was true, no HTTT Status Code is needed
    }

    // Fetch the database the intents json of the user
    const [rows, fields] = await queryDB(force, `SELECT intents FROM usuarios WHERE username = ${authenticatedTokens[token]}`);

    if (rows.length === 0) {
        return [false, 500, "Algo de errado ocorreu. Tente novamente mais tarde"];
    }

    // Converting the row to a JSON object
    let userIntents = JSON.parse(rows[0].intents);

    // Check if the user has the intent
    if (userIntents[intent]) {
        return [true, 200];
    }

    return [false, 403, "Não tens permissão para realizar esta ação"];

}

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
    let force = req.headers.force;

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
    let validation = await checkTokenValidityIntents(req.headers.authorization, req.headers.force, req.body.intent);

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
    if (!req.body.username || !req.body.password) {
        res.status(400).json({
            message: "Não foi fornecido um username ou password",
        });
        return;
    }

    // Check if the user exists

    const [rows, fields] = await poolDefaultPSP.query(`SELECT password FROM usuarios WHERE username = ${req.body.username}`);

    // If the user doesn't exist, return an error
    if (rows.length === 0) {
        res.status(401).json({
            message: "O username fornecido não existe."
        });
        return;
    }

    // If the password is NULL, then the correct password would be "seguranca"
    if (rows[0].password === null) {
        if (req.body.password !== "seguranca") {
            res.status(401).json({
                message: "Password incorreta."
            });
            return;
        }

        // If everything is correct, generate a token and store it in the authenticatedTokens list
        let token = generateToken(req.body.username);

        // Send the token to the user
        res.status(200).json({
            message: "Operação bem sucedida",
            data: token
        });
        return;
    }

    // If the password is not NULL, check if it is correct
    if (rows[0].password !== req.body.password) { // TODO: Hash the password
        res.status(401).json({
            message: "Password incorreta."
        })
        return;
    }

    // If everything is correct, generate a token and store it in the authenticatedTokens list
    let token = generateToken(req.body.username);

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
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization, req.headers.force);
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

    const [rows, fields] = await queryDB(req.headers.force, `SELECT nome, patente, callsign, status, nif FROM efetivosV WHERE CONCAT(nome, patente, callsign, nif, telemovel, discord) LIKE "%${req.query.search}%"`);
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows
    });
});

app.get("/api/officerInfo/:nif", async (req, res) => {
    // Check if user is authenticated
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization, req.headers.force);
    if (!authenticatedPermission[0]) {
        res.status(authenticatedPermission[1]).json({
            message: authenticatedPermission[2]
        });
        return;
    }

    const [rows, fields] = await queryDB(req.headers.force, `SELECT * FROM ${req.headers.raw === "true" ? "efetivos" : "efetivosV"} WHERE nif = ${req.params.nif}`);

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