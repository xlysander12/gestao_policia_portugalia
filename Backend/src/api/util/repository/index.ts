import {PatentData, StatusData} from "@portalseguranca/api-types/util/schema";
import {queryDB} from "../../../utils/db-connector";

export async function getForcePatents(force: string, patent_id?: number): Promise<PatentData[]> {
    // Get the list from the database
    const patents = await queryDB(force, `SELECT * FROM patents ${patent_id ? `WHERE id = ${patent_id}` : ""}`, patent_id);

    // Build an array with the patents
    let patentsList: PatentData[] = [];
    for (const patent of patents) {
        patentsList.push({
            id: patent.id,
            name: patent.name,
            max_evaluation: patent.max_evaluation,
            leading_char: patent.leading_char
        });
    }

    return patentsList;
}

export async function getForceStatuses(force: string): Promise<StatusData[]> {
    // Get the list from the database
    const statuses = await queryDB(force, `SELECT * FROM status`);

    // Build an array with the statuses
    let statusesList: StatusData[] = [];
    for (const status of statuses) {
        statusesList.push({
            id: status.id,
            name: status.name
        });
    }

    return statusesList;
}