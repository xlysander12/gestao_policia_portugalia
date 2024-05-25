// Importing dotenv and initializing it
const dotenv = require("dotenv");
dotenv.config({path: __dirname + "\\.env"});

// Importing necessary modules
const express = require("express");
const app = express.Router(); // This app is a router to compartimentalize routes
const path = require("path");
const {queryDB} = require("./db-connector");

// Forces list
const forces = ["psp", "gnr"];

// React Static
app.use(express.static(path.join(__dirname, "..", "frontend", "build")));


/************************************
 * Token / Authentication Functions *
 ***********************************/

async function generateToken() {
    // Before generating a token, making sure the user doesn't have any tokens already, and if it does, delete them
    // for (const force of forces) {
    //     await queryDB(force, `DELETE FROM tokens WHERE nif = ${nif}`)
    // }

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
        let exists = false;
        for (const force of forces) {
            let [rows, fields] = await queryDB(force, `SELECT * FROM tokens WHERE token = "${token}"`);
            if (rows.length !== 0) {
                exists = true;
            }
        }

        // If the token doesn't exist, set unique to true
        unique = !exists;
    }

    // Return the token
    return token;
}

async function checkTokenValidityIntents(token, force, intent) {
    // Check if the token is present
    if (token === undefined || token === null) {
        return [false, 401, "Não foi fornecido um token de autenticação."];
    }

    // Making sure force is specified
    if (force === undefined) {
        return [false, 400, "Não foi fornecida uma força para a validação do token."];
    }

    // Querying the Database to check if the token exists
    let [rows, fields] = await queryDB(force, `SELECT nif FROM tokens WHERE token = "${token}"`);
    if (rows.length === 0) {
        return [false, 401, "O token fornecido não é válido."];
    }

    // Store the nif the token points to
    let nif = rows[0].nif;

    // Once it has been confirmed the token exists, the lastUsed field should be updated in all databases
    // It's used the `then()` method to avoid waiting for the query to finish since the result is not needed
    for (const forcesKey of forces) {
        queryDB(forcesKey, `UPDATE tokens SET last_used = CURRENT_TIMESTAMP WHERE token = "${token}"`).then(_ => {});
    }

    // If intent is null, then the user doesn't need special permissions
    if (intent === null || intent === undefined) {
        return [true, 0, nif]; // Since the return was true, no HTTT Status Code is needed
    }

    // Fetch from the database the intents json of the user
    [rows, fields] = await queryDB(force, `SELECT intents FROM users WHERE nif = ${nif}`);

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


    return [true, 200, nif];
}

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
    const [rows, fields] = await queryDB(force, `SELECT * FROM patents`);

    // Send the list to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows
    });
});


app.get("/api/util/statuses", async (req, res) => {
    let force = req.headers["x-portalseguranca-force"];

    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

    // Get the list from the database
    const [rows, fields] = await queryDB(force, `SELECT * FROM status`);

    // Send the list to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: rows
    });
});

app.get("/api/util/specialunits", async (req, res) => {
    let force = req.headers["x-portalseguranca-force"];

    // Check if the force is present
    if (force === undefined) {
        res.status(400).json({
            message: "Não foi fornecida uma força para a obtenção das patentes."
        });
        return;
    }

    // Get all the special units from the database
    let [rows, fields] = await queryDB(force, `SELECT * FROM special_units`);
    let response = {};
    response.units = rows;

    // Get all the roles for the units
    [rows, fields] = await queryDB(force, `SELECT * FROM specialunits_roles`);
    response.roles = rows;

    res.status(200).json({
        message: "Operação bem sucedida",
        data: response
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
        data: validation[2]
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
    for (const force of forces) {
        const [rows, fields] = await queryDB(force, `SELECT password FROM users WHERE nif = ${req.body.nif}`);
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
    const token = await generateToken();

    // After generating the token, store it in the databases of the forces the user belongs to
    for (const force of forces) {
        try {
            await queryDB(force, `INSERT INTO tokens (token, nif) SELECT "${token}", ${req.body.nif}`);
        } catch (e) { // This error would only be if trying to store a token for an user that doesn't exist
            res.status(500).json({
                message: "Erro ao tentar guardar o token"
            });

            return;
        }

    }

    // Send the token to the user
    res.status(200).json({
        message: "Operação bem sucedida",
        data: token
    });
});

// Patch Endpoint to change password
app.patch("/api/login", (req, res) => {
    // TODO: Implement this endpoint to change user's password
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

    const [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT name, patent, callsign, status, nif FROM officersV WHERE CONCAT(name, patent, callsign, nif, phone, discord) LIKE "%${req.query.search}%"`);
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

    let [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT * FROM ${req.query.hasOwnProperty("raw") ? "officers" : "officersV"} WHERE nif = ${req.params.nif}`);

    if (rows.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    const info = rows[0];

    // Alter the dates to be a proper string (There's a lot of unknown shit going on here. For more information on wtf is going on, check https://stackoverflow.com/a/29774197)
    info.entry_date = new Date(info.entry_date.getTime() - (info.entry_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    info.promotion_date = info.promotion_date !== null ? new Date(info.promotion_date.getTime() - (info.promotion_date.getTimezoneOffset() * 60000)).toISOString().split("T")[0]: null;

    info.special_units = [];

    [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT unit, role FROM specialunits_officers WHERE nif = ${req.params.nif} ORDER BY role DESC, unit DESC`);
    rows.forEach((row) => {
        info.special_units.push({"id": row.unit, "role": row.role});
    });

    res.status(200).json({
        message: "Operação bem sucedida",
        data: info
    });
});

app.patch("/api/officerInfo/:nif", async (req, res) => {
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization, req.headers["x-portalseguranca-force"], "officer");
    if (!authenticatedPermission[0]) {
        res.status(authenticatedPermission[1]).json({
            message: authenticatedPermission[2]
        });
        return;
    }

    // Check if the requested officer exists
    let [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT patent, status FROM officers WHERE nif = ${req.params.nif}`);
    if (rows.length === 0) {
        res.status(404).json({
            message: "Não foi encontrado nenhum efetivo com o NIF fornecido."
        });
        return;
    }

    // After making sure the officer exists, figure out if this change is considered a promotion
    // TODO: This needs to be properly address when additional forces are added. Statuses may vary between them.
    let isPromotion = rows[0].patent !== req.body.patent // If patent has changed
        || (rows[0].status === 1 && req.body.status === 3)  // If status has changed from "Formação" to "Ativo"
        || (rows[0].status === 2 && req.body.status === 3); // If status has changed from "Provisório" to "Ativo"


    // Check if the user can edit the requested officer
    const requestedOfficerPatente = rows[0].patent;

    [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT patent FROM officers WHERE nif = ${authenticatedPermission[2]}`);
    const requestingOfficerPatente = rows[0].patent;

    if (requestedOfficerPatente >= requestingOfficerPatente) {
        res.status(403).json({
            message: "Não tens permissão para editar este efetivo."
        });
        return;
    }

    // If everything checks out, update the officer's basic info
    let updateQuery = `UPDATE officers SET name = "${req.body.name}", patent = ${req.body.patent}, 
                              callsign = "${req.body.callsign}", status = ${req.body.status}, 
                              entry_date = "${req.body.entry_date}", 
                              phone = ${req.body.phone}, iban = "${req.body.iban}", kms = ${req.body.kms}, 
                              discord = ${req.body.discord}, steam = "${req.body.steam}" WHERE nif = ${req.params.nif}`;
    await queryDB(req.headers["x-portalseguranca-force"], updateQuery);

    // If the change is considered a promotion, update the promotion date
    if (isPromotion) {
        await queryDB(req.headers["x-portalseguranca-force"], `UPDATE officers SET promotion_date = CURRENT_TIMESTAMP WHERE nif = ${req.params.nif}`);
    }

    // Now, update the special units the officer belongs to
    if (req.body.special_units !== undefined) {
        await queryDB(req.headers["x-portalseguranca-force"], `DELETE FROM specialunits_officers WHERE nif = ${req.params.nif}`);
        for (const unit of req.body.special_units) {
            await queryDB(req.headers["x-portalseguranca-force"], `INSERT INTO specialunits_officers (nif, unit, role) VALUES (${req.params.nif}, ${unit.id}, "${unit.role}")`);
        }
    }

    // After all is complete, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });
});

app.put("/api/officerInfo/:nif", async (req, res) => {
    // Making sure requesting user has permission to add officers
    let authenticatedPermission = await checkTokenValidityIntents(req.headers.authorization, req.headers["x-portalseguranca-force"], "officer");
    if (!authenticatedPermission[0]) {
        res.status(authenticatedPermission[1]).json({
            message: authenticatedPermission[2]
        });
        return;
    }

    // Making sure the user has provided all necessary information
    if (req.body.name === undefined || req.body.phone === undefined || req.body.iban === undefined || req.body.kms === undefined || req.body.discord === undefined || req.body.steam === undefined) {
        res.status(400).json({
            message: "Não foram fornecidos todos os dados necessários. É necessário fornecer nome, telemovel, iban, kms, discord e steam."
        });
        return;
    }

    // Making sure the provided nif doesn't already exist
    let [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT * FROM officers WHERE nif = ${req.params.nif}`);
    if (rows.length !== 0) {
        res.status(400).json({
            message: "Já existe um outro efetivo com esse NIF."
        });
        return;
    }

    // Checking if the patent will be a recruit or not
    let patente = req.query.hasOwnProperty("recruit") ? -1: 0;

    // Calculating what the new callsign will be, if it's not a recruit
    let callsign = null
    if (patente === 0) {
        [rows, fields] = await queryDB(req.headers["x-portalseguranca-force"], `SELECT callsign FROM officers WHERE callsign REGEXP "^A-[0-9]{1,2}$" ORDER BY callsign DESC`);
        let callsign_number = (Number.parseInt(rows[0].callsign.split("-")[1]) + 1);
        callsign = `A-${callsign_number.toString().padStart(2, "0")}`;
    }

    // Adding the officer to the database
    await queryDB(req.headers["x-portalseguranca-force"], `INSERT INTO officers (name, patent, callsign, phone, nif, iban, kms, discord, steam) VALUES ("${req.body.name}", ${patent}, "${callsign}", ${req.body.phone}, ${req.params.nif}, "${req.body.iban}", ${req.body.kms}, ${req.body.discord}, "${req.body.steam}")`);

    // If everything went according to plan, return a 200 status code
    res.status(200).json({
        message: "Operação bem sucedida"
    });

});

// React Build
app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "build", "index.html"));
});

module.exports = app;