import {google} from "googleapis";
import path from "node:path";

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

export async function getSheetValues(spreadsheetId: string, sheetName: string) {
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