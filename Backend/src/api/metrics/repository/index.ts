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
        code: errorDetails[0].code,
        route: errorDetails[0].route,
        method: errorDetails[0].method,
        body: errorDetails[0].body,
        timestamp: errorDetails[0].timestamp,
        stack: errorDetails[0].stack
    }
}