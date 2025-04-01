import {DefaultReturn, InnerOfficerData} from "../../../types";
import {buildBodyOfficerDetails, submitIssueToGithub} from "../utils";
import {getErrorDetails, setErrorReported} from "../repository";
import {dateToString} from "../../../utils/date-handler";

export async function sendIssue(loggedUser: InnerOfficerData, title: string, body: string, code?: string): Promise<DefaultReturn<void>> {
    // * Manipulating the values to be used in the issue creation
    let issueTitle = `${title} - Issue Automático`;

    // Appending to the body the information given by the user
    let issueBody = await buildBodyOfficerDetails(loggedUser);
    issueBody += `# Detalhes do problema\n`;
    issueBody += code !== undefined ? `**Código de erro:** ${code}\n` : "";
    issueBody += "**Descrição do utilizador:**\n"

    // Adding the information about the error code
    if (code !== undefined) {
        issueBody += body + "\n\n";
        issueBody += "# Detalhes do erro\n";

        // Fetching DB information from the error code
        const errorDetails = await getErrorDetails(loggedUser.force, code);
        if (!errorDetails) {
            issueBody += "*Error não encontrado*"
        } else {
            issueBody += `**Rota:** ${errorDetails.method} ${errorDetails.route}\n`;
            issueBody += `**Corpo:** ${errorDetails.body}\n`;
            issueBody += `**Timestamp:** ${dateToString(errorDetails.timestamp)}\n`;
            issueBody += `**Stack:**\n\`\`\`\n${errorDetails.stack}\n\`\`\``;
        }
    }

    // Submitting the issue to github
    const githubResponse = await submitIssueToGithub(issueTitle, issueBody, ["auto added", "bug"]);

    // If the response is not a 201 status code, return an error
    if (githubResponse.status !== 201) {
        return {result: false, status: 500, message: "Ocorreu um erro ao enviar o problema"};
    }

    // If an error code was provided, set his "reported" status in the DB to 1
    if (code !== undefined) {
        const errorDetails = await getErrorDetails(loggedUser.force, code);
        if (errorDetails) {
            await setErrorReported(loggedUser.force, code);
        }
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
        return {result: false, status: 500, message: "Ocorreu um erro ao enviar a sugestão"};
    }

    // Return a 200 status code
    return {result: true, status: 200, message: "Sugestão enviada com sucesso. Obrigado!"};
}