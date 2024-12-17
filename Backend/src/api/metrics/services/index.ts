import {DefaultReturn, InnerOfficerData} from "../../../types";
import {buildBodyOfficerDetails, submitIssueToGithub} from "../utils";

export async function sendIssue(loggedUser: InnerOfficerData, title: string, body: string, code?: string): Promise<DefaultReturn<void>> {
    // * Manipulating the values to be used in the issue creation
    let issueTitle = `${title} - Issue Automático`;

    // Body manipulation
    let issueBody = await buildBodyOfficerDetails(loggedUser);
    issueBody += `# Detalhes do problema\n`;
    issueBody += code !== undefined ? `Código de erro: ${code}\n` : "";
    issueBody += body;

    // Submitting the issue to github
    const githubResponse = await submitIssueToGithub(issueTitle, issueBody, ["auto added", "bug"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        return {result: false, status: githubResponse.status, message: "Ocorreu um erro ao enviar o problema"};
    }

    // Return a 200 status code
    return {result: true, status: 200, message: "Problema reportado com sucesso. Obrigado!"};
}

export async function sendSuggestion(loggedUser: InnerOfficerData, title: string, body: string): Promise<DefaultReturn<void>> {
    // * Manipulating the values to be used in the issue creation
    let issueTitle = `${title} - Issue Automático`;

    // Body manipulation
    let issueBody = await buildBodyOfficerDetails(loggedUser);
    issueBody += `# Detalhes da sugestão\n`;
    issueBody += body;

    // Submitting the issue to github
    const githubResponse = await submitIssueToGithub(issueTitle, issueBody, ["auto added", "enhancement"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        return {result: false, status: githubResponse.status, message: "Ocorreu um erro ao enviar o problema"};
    }

    // Return a 200 status code
    return {result: true, status: 200, message: "Problema reportado com sucesso. Obrigado!"};
}