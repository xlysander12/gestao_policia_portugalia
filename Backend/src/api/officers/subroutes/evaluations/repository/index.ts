import {Evaluation, MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {queryDB} from "../../../../../utils/db-connector";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../../../utils/filters";
import {RouteFilterType} from "../../../../routes";
import {userHasIntents} from "../../../../accounts/repository";
import {dateToUnix} from "../../../../../utils/date-handler";
import {EditEvaluationBodyType, EvaluationBodyFieldsType} from "@portalseguranca/api-types/officers/evaluations/input";
import {ResultSetHeader} from "mysql2/promise";

export async function getEvaluations(force: string, requester: number, target: number, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams, page: number = 1, entries_per_page: number = 10): Promise<MinifiedEvaluation[]> {
    if (filters && !routeValidFilters) throw new Error("routeValidFilters must be present when filters are passed");

    // Check if the user has the "evaluations" intent
    const all = await userHasIntents(requester, force, "evaluations");

    // Build the filters query and values
    const filtersResult = buildFiltersQuery(routeValidFilters!, filters, {subquery: all ? "target = ?" : "target = ? AND author = ?", value: all ? target : [target, requester]});

    // Query the database to get the evaluations
    const result = await queryDB(force, `SELECT id, target, author, timestamp FROM evaluationsV ${filtersResult.query} LIMIT ${entries_per_page} OFFSET ${(page - 1) * entries_per_page}`, filtersResult.values);

    // Return the evaluations
    const evaluations: MinifiedEvaluation[] = [];
    for (const row of result) {
        evaluations.push({
            id: row.id,
            target: row.target,
            author: row.author,
            timestamp: dateToUnix(row.timestamp),
            average: (await queryDB(force, `SELECT CEILING(AVG(grade)) AS average FROM evaluations_data WHERE evaluation = ?`, [row.id]))[0].average
        });
    }

    return evaluations;
}

export async function getAuthoredEvaluations(force: string, officer: number, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams, page: number = 1, entries_per_page: number = 10): Promise<MinifiedEvaluation[]> {
    if (filters && !routeValidFilters) throw new Error("routeValidFilters must be present when filters are passed");

    // Build the filters query and values
    const filtersResult = buildFiltersQuery(routeValidFilters!, filters, {subquery: "author = ?", value: officer});

    // Query the database to get the evaluations
    const result = await queryDB(force, `SELECT id, target, author, timestamp FROM evaluationsV ${filtersResult.query} LIMIT ${entries_per_page} OFFSET ${(page - 1) * entries_per_page}`, filtersResult.values);

    // Return the evaluations
    const evaluations: MinifiedEvaluation[] = [];
    for (const row of result) {
        evaluations.push({
            id: row.id,
            target: row.target,
            author: row.author,
            timestamp: dateToUnix(row.timestamp),
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

export async function updateEvaluationGrades(force: string, id: number, grades: EvaluationBodyFieldsType) {
    // Delete all data from the evaluation on the DB
    await queryDB(force, `DELETE FROM evaluations_data WHERE evaluation = ?`, [id]);

    // Insert the new data into the DB
    for (const field in grades) {
        await queryDB(force, `INSERT INTO evaluations_data (evaluation, field, grade) VALUES (?, ?, ?)`, [id, parseInt(field), grades[field]]);
    }
}

export async function addEvaluation(force: string, author: number, target: number, fields: EvaluationBodyFieldsType, patrol?: number, comments?: string, timestamp?: number): Promise<number> {
    // Insert the evaluation into the DB
    const result = await queryDB(force, `INSERT INTO evaluations (target, author, patrol, comments, timestamp) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))`, [target, author, patrol || null, comments || null, timestamp || null]);

    // Get the ID of the inserted evaluation
    const id = (result as unknown as ResultSetHeader).insertId;

    // Insert the fields into the DB
    await updateEvaluationGrades(force, id, fields);

    return id;
}

export async function editEvaluation(force: string, id: number, changes: EditEvaluationBodyType) {
    // Build the query
    const values: string[] = [];
    const query = `UPDATE evaluations SET ${Object.keys(changes).reduce((acc, field) => {
        if (field === "fields") return acc;
        
        // Add the value to the values array
        values.push(changes[field as keyof EditEvaluationBodyType] as string);
        
        // Add the field to the query
        return acc + `${field} = ?, `;
    }, "").slice(0, -2)} WHERE id = ?`;

    // Execute the query
    await queryDB(force, query, [...values, id]);

    // Update the fields in the DB, if they are present
    if (changes.fields) {
        await updateEvaluationGrades(force, id, changes.fields);
    }
}