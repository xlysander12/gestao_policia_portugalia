const express = require("express");
// const {Octokit} = require("octokit")
const {checkTokenValidityIntentsHeaders} = require("../utils/token-handler");
const {queryDB} = require("../utils/db-connector");

// Creating the router
const app = express.Router();

// Creating the instance of the octokit for github authentication
/* const octokitInstance = new Octokit({
    auth: process.env.GITHUB_TOKEN
}); */

async function getBodyAuthorDetails(nif, force) {
    // Fetching the user's patent and name from NIF
    const userResult = await queryDB(force, 'SELECT name, patent, discord FROM officersV WHERE nif = ?', nif);
    const author = `${userResult[0].patent} ${userResult[0].name}`


    let body = `# Informações sobre o autor\n`;
    body += `Identificação: ${author}\n`;
    body += `NIF: ${nif}\n`;
    body += `Discord: ${userResult[0].discord}\n\n`;

    return body;
}

async function submitIssue(title, body, labels) {
    console.log(`New Issue:\n${title}\n${body}`)
    return await fetch("https://api.github.com/repos/xlysander12/gestao_policia_portugalia/issues", {
        method: "POST",
        headers: {
            "Authorization": `bearer ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/vnd.github+json"
        },
        body: JSON.stringify({
            title: title,
            body: body,
            labels: labels
        })
    });
}

app.post("/issue", async (req, res) => {
    // Making sure the request is valid
    if (!req.body.title || !req.body.body) {
        res.status(400).json({error: "Invalid request"});
        return;
    }

    // Making sure the creator is authenticated
    const validation = await checkTokenValidityIntentsHeaders(req.headers);
    if (!validation[0]) {
        res.status(validation[1]).json({
            message: validation[2]
        });
        return;
    }

    // Getting the nif of the logged user
    const loggedNif = validation[2];

    // Manipulating the values to be used in the issue creation
    const title = `${req.body.title} - Issue Automático`;

    // // Body manipulation
    let body = await getBodyAuthorDetails(loggedNif, req.headers["x-portalseguranca-force"]);
    body += `# Detalhes do problema\n`;
    body += req.body.code !== undefined ? `Código de erro: ${req.body.code}\n` : "";
    body += req.body.body;

    // Submitting the issue to github
    const githubResponse = await submitIssue(title, body, ["auto added", "bug"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        res.status(500).json({message: "An error occurred while creating the issue"});
        return;
    }

    // Return a 200 status code
    res.status(200).json({message: "Problema reportado com sucesso!"});
});


app.post("/sugestion", async (req, res) => {
    // Making sure the request is valid
    if (!req.body.title || !req.body.body) {
        res.status(400).json({message: "Não foram preenchidos todos os campos"});
        return;
    }

    const validation = await checkTokenValidityIntentsHeaders(req.headers);
    if (!validation[0]) {
        res.status(validation[1]).json({
            message: validation[2]
        });
        return;
    }

    // Getting the nif of the logged user
    const loggedNif = validation[2];

    // Manipulating the values to be used in the issue creation
    const title = `${req.body.title} - Issue Automático`;

    // // Body manipulation
    let body = await getBodyAuthorDetails(loggedNif, req.headers["x-portalseguranca-force"])
    body += `# Detalhes da sugestão\n`;
    body += req.body.body;

    const githubResponse = await submitIssue(title, body, ["auto added", "enhancement"])

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        res.status(500).json({message: "An error occurred while creating the issue"});
        return;
    }

    // Return a 200 status code
    res.status(200).json({message: "Suggestion created successfully"});
});

// Exporting the Router
module.exports = app;

console.log("[Portal Segurança] Metrics routes loaded successfully!")