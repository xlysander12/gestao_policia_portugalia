import {queryDB} from "../../../utils/db-connector";
import {InnerError} from "../../../types/inner-types";

export async function getErrorDetails(force: string, code: string): Promise<InnerError | null> {
    // * Fetching the error details from the database
    const errorDetails = await queryDB(force, `SELECT * FROM errors WHERE code = ?`, code);

    // If the error details are not found, return an empty object
    if (errorDetails.length === 0) {
        return null;
    }

    // Return the error details
    return {
        code: errorDetails[0].code as string,
        route: errorDetails[0].route as string,
        method: errorDetails[0].method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD",
        body: errorDetails[0].body as string,
        timestamp: errorDetails[0].timestamp as Date,
        stack: errorDetails[0].stack as string
    }
}

export async function setErrorReported(force: string, code: string) {
    // Querying the DB to change the column
    await queryDB(force, `UPDATE errors SET reported = 1 WHERE code = ?`, code);
}