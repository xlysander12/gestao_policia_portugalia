import {InnerOfficerData} from "../../../types";
import {Octokit} from "@octokit/core";
import {createAppAuth} from "@octokit/auth-app";
import fs from "fs/promises";
import path from "node:path";
import {getForcePatents} from "../../util/repository";
import {PatentData} from "@portalseguranca/api-types/util/output";

async function getOcotkit() {
    const PRIVATE_KEY = (await fs.readFile(path.join(__dirname, "..", "..", "..", "assets", "github-issues-app.pem"), "utf-8"));

    const auth = createAppAuth({
        appId: process.env["GH_APP_ID"]!,
        privateKey: PRIVATE_KEY,
        installationId: process.env["GH_APP_INSTALLATION_ID"]!,
    });

    const {token} = await auth({type: "installation"});

    return new Octokit({auth: token});
}

export async function buildBodyOfficerDetails(officer: InnerOfficerData) {
    // Get officer patent object
    const patent = (await getForcePatents(officer.force, officer.patent))! as PatentData;

    let body = `# Informações sobre o autor\n`;
    body += `**Identificação:** ${patent.name} ${officer.name}\n`;
    body += `**NIF:** ${officer.nif}\n`;
    body += `**Discord:** ${officer.discord}\n\n`;

    return body;
}

export async function submitIssueToGithub(title: string, body: string, labels: string[]) {
    // Get Octokit instance
    const octokit = await getOcotkit();

    return await octokit.request(`POST /repos/${process.env["GH_REPO_OWNER"]}/${process.env["GH_REPO_NAME"]}/issues`, {
        title: title,
        body: body,
        labels: labels
    });
}