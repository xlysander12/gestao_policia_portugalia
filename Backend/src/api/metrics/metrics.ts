import express from "express";
import {queryDB} from "../../utils/db-connector";
import {FORCE_HEADER, ForceType} from "../../utils/constants";
import {SubmitIssueRequestBodyType, SubmitSuggestionRequestBodyType} from "@portalseguranca/api-types/metrics/input";

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
    const {title, body, code} = req.body as SubmitIssueRequestBodyType;

    // Getting the nif of the logged user
    const loggedNif = Number(res.locals.user)

    // Manipulating the values to be used in the issue creation
    let issueTitle = `${title} - Issue Automático`;

    // // Body manipulation
    let issueBody = await getBodyAuthorDetails(loggedNif, req.header(FORCE_HEADER));
    issueBody += `# Detalhes do problema\n`;
    issueBody += code !== undefined ? `Código de erro: ${code}\n` : "";
    issueBody += body;

    // Submitting the issue to github
    const githubResponse = await submitIssue(issueTitle, issueBody, ["auto added", "bug"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        res.status(500).json({message: "Um erro ocorreu ao reportar o problema"});
        return;
    }

    // Return a 200 status code
    res.status(200).json({message: "Problema reportado com sucesso!"});
});


app.post("/suggestion", async (req, res) => {
    const {title, body} = req.body as SubmitSuggestionRequestBodyType;

    // Getting the nif of the logged user
    const loggedNif = Number(res.locals.user);

    // Manipulating the values to be used in the issue creation
    const suggestionTitle = `${title} - Issue Automático`;

    // // Body manipulation
    let suggestionBody = await getBodyAuthorDetails(loggedNif, req.header(FORCE_HEADER));
    suggestionBody += `# Detalhes da sugestão\n`;
    suggestionBody += body;

    const githubResponse = await submitIssue(suggestionTitle, suggestionBody, ["auto added", "enhancement"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        res.status(500).json({message: "Ocorreu um erro ao enviar a sugestão"});
        return;
    }

    // Return a 200 status code
    res.status(200).json({message: "Sugestão criada com sucesso! Obrigado!"});
});

console.log("[Portal Segurança] Metrics routes loaded successfully!");

export default app;