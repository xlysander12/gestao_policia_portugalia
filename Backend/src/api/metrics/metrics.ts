import express from "express";
import {queryDB} from "../../utils/db-connector";
import {ForceType} from "../../utils/constants";

// Creating the router
const app = express.Router();

async function getBodyAuthorDetails(nif: number, force: ForceType) {
    // Fetching the user's patent and name from NIF
    const userResult = await queryDB(force, 'SELECT name, patent, discord FROM officersV WHERE nif = ?', String(nif));
    const author = `${userResult[0].patent} ${userResult[0].name}`


    let body = `# Informações sobre o autor\n`;
    body += `Identificação: ${author}\n`;
    body += `NIF: ${nif}\n`;
    body += `Discord: ${userResult[0].discord}\n\n`;

    return body;
}

async function submitIssue(title: string, body: string, labels: string[]) {
    console.log(`New Issue:\n${title}\n${body}`)
    return await fetch("https://api.github.com/repos/xlysander12/gestao_policia_portugalia/issues", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
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
        res.status(400).json({error: "O pedido deve conter um titulo e texto"});
        return;
    }

    // Getting the nif of the logged user
    const loggedNif = Number(res.locals.user)

    // Manipulating the values to be used in the issue creation
    const title = `${req.body.title} - Issue Automático`;

    // // Body manipulation
    let body = await getBodyAuthorDetails(loggedNif, req.header("x-portalseguranca-force"));
    body += `# Detalhes do problema\n`;
    body += req.body.code !== undefined ? `Código de erro: ${req.body.code}\n` : "";
    body += req.body.body;

    // Submitting the issue to github
    const githubResponse = await submitIssue(title, body, ["auto added", "bug"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        res.status(500).json({message: "Um erro ocorreu ao reportar o problema"});
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

    // Getting the nif of the logged user
    const loggedNif = Number(res.locals.user);

    // Manipulating the values to be used in the issue creation
    const title = `${req.body.title} - Issue Automático`;

    // // Body manipulation
    let body = await getBodyAuthorDetails(loggedNif, req.header("x-portalseguranca-force"));
    body += `# Detalhes da sugestão\n`;
    body += req.body.body;

    const githubResponse = await submitIssue(title, body, ["auto added", "enhancement"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        res.status(500).json({message: "Ocorreu um erro ao enviar a sugestão"});
        return;
    }

    // Return a 200 status code
    res.status(200).json({message: "Sugestão criara com sucesso! Obrigado!"});
});

console.log("[Portal Segurança] Metrics routes loaded successfully!");

export default app;