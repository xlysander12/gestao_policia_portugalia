import {google} from "googleapis";
import path from "node:path";
import readExcelFile from "read-excel-file/node";
import {Agent, request} from "undici";

async function getAuthSheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "..", "assets", "google-creds.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });

    const client = await auth.getClient();

    // @ts-expect-error - I still don't know how to fix this - just following tutorial
    const googleSheets = google.sheets({
        version: "v4",
        auth: client
    });

    return {
        auth,
        client,
        googleSheets
    }
}

async function getGoogleSheetsValues(spreadsheetId: string, sheetName: string) {
    const {googleSheets, auth} = await getAuthSheets();

    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        auth,
        range: sheetName,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING"
    });

    return response.data.values;
}

async function getNextcloudSheetsValues(url: string, sheetName: string) {
    // Create a custom agent to disable keep-alive
    const agent = new Agent({
        keepAliveTimeout: 1_000,
        keepAliveMaxTimeout: 1_000,
        pipelining: 0
    });

    // Get binary data from the URL
    const response = await request(`${url}?cacheBust=${Date.now()}`, {
        dispatcher: agent,
        headers: {
            "Cache-Control": "no-cache, no-store",
            "Pragma": "no-cache",
            "Connection": "close"
        }
    });

    // If no response, throw an error
    if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch the Excel file from ${url}: ${response.statusText}`);
    }

    console.log({
        status: response.statusCode,
        etag: response.headers.etag,
        lastModified: response.headers["last-modified"],
    });

    // Convert the response to a buffer
    const blob = await response.body.blob();

    // Read the binary data as an Excel file
    const excel = await readExcelFile(blob);

    // Get the matrix of the specified sheet
    const sheet = excel.find(sheet => sheet.sheet === sheetName);

    if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found in the Excel file from ${url}`);
    }

    // Replace all "nulls" for empty strings
    sheet.data = sheet.data.map(row => row.map(cell => cel-l === null ? "" : cell));

    return sheet.data;
}

export async function getSheetValues(type: string, spreadsheetId: string, sheetName: string) {
    if (type === "google") {
        return await getGoogleSheetsValues(spreadsheetId, sheetName);
    }

    if (type === "nextcloud") {
        return await getNextcloudSheetsValues(spreadsheetId, sheetName);
    }
}