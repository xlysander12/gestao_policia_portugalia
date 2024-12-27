import {InnerOfficerData} from "../../../types";

export async function buildBodyOfficerDetails(officer: InnerOfficerData) {
    let body = `# Informações sobre o autor\n`;
    body += `Identificação: ${officer.patent} ${officer.name}\n`;
    body += `NIF: ${officer.nif}\n`;
    body += `Discord: ${officer.discord}\n\n`;

    return body;
}

export async function submitIssueToGithub(title: string, body: string, labels: string[]) {
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