import {Evaluation, MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {queryDB} from "../../../../../utils/db-connector";

export async function getEvaluations(force: string, requester: number, target: number, all: boolean = false): Promise<MinifiedEvaluation[]> {
    // Query the database to get the evaluations
    const result = all ?
        await queryDB(force, `SELECT id, target, author, timestamp FROM evaluationsV WHERE target = ?`, [target]) :
        await queryDB(force, `SELECT id, target, author, timestamp FROM evaluationsV WHERE target = ? AND author = ?`, [target, requester])
    ;


    const evaluations: MinifiedEvaluation[] = [];
    for (const row of result) {
        evaluations.push({
            id: row.id,
            target: row.target,
            author: row.author,
            timestamp: row.timestamp.getTime(),
            average: (await queryDB(force, `SELECT CEILING(AVG(grade)) AS average FROM evaluations_data WHERE evaluation = ?`, [row.id]))[0].average
        });
    }

    return evaluations;
}

export async function getEvaluationData(force: string, id: number): Promise<Evaluation | null> {
    // Get the basic data of the evaluation
    const basicQueryResult = await queryDB(force, `SELECT * FROM evaluationsV WHERE id = ?`, [id]);

    // Check if the evaluation exists
    if (basicQueryResult.length === 0) {
        return null;
    }

    // Get the fields of the evaluation
    const fieldsQueryResult = await queryDB(force, `SELECT field, grade FROM evaluations_data WHERE evaluation = ?`, [id]);

    // * Parse the fields
    const fields: {[field: number]: number} = {};

    // Since the field column is unique, we can just iterate over the fieldsQueryResult
    for (const field of fieldsQueryResult) {
        fields[field.field] = field.grade;
    }

    return {
        id: basicQueryResult[0].id,
        target: basicQueryResult[0].target,
        author: basicQueryResult[0].author,
        patrol: basicQueryResult[0].patrol,
        comments: basicQueryResult[0].comments,
        timestamp: basicQueryResult[0].timestamp.getTime(),
        fields: fields
    }
}