import {google} from "googleapis";
import path from "node:path";
import readExcelFile from "read-excel-file/node";

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
    // Get binary data from the URL
    const response = await fetch(url);

    // If no response, throw an error
    if (!response.ok) {
        throw new Error(`Failed to fetch the Excel file from ${url}: ${response.statusText}`);
    }

    // Convert the response to a buffer
    const blob = await response.blob();

    // Read the binary data as an Excel file
    // @ts-expect-error THIS SUCKS
    const excel = await readExcelFile(blob);

    // Get the matrix of the specified sheet
    const sheet = excel.find(sheet => sheet.sheet === sheetName);

    if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found in the Excel file from ${url}`);
    }

    // Replace all "nulls" for empty strings
    sheet.data = sheet.data.map(row => row.map(cell => cell === null ? "" : cell));

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