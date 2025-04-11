import {Evaluation, MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {queryDB} from "../../../../../utils/db-connector";
import buildFiltersQuery, {ReceivedQueryParams} from "../../../../../utils/filters";
import {RouteFilterType} from "../../../../routes";
import {dateToUnix} from "../../../../../utils/date-handler";
import {EditEvaluationBodyType, EvaluationBodyFieldsType} from "@portalseguranca/api-types/officers/evaluations/input";
import {ResultSetHeader} from "mysql2/promise";
import {InnerOfficerData} from "../../../../../types";

export async function getEvaluations(force: string, requester: InnerOfficerData, target: number, all = false, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams, page = 1, entries_per_page = 10): Promise<{
    pages: number,
    evaluations: MinifiedEvaluation[]
}> {
    if (filters && !routeValidFilters) throw new Error("routeValidFilters must be present when filters are passed");

    // Build the filters query and values
    const filtersResult = buildFiltersQuery(routeValidFilters!, filters, {subquery: all ? "target = ? AND author.patent <= requester.patent" : "target = ? AND author = ?", value: all ? target : [target, requester.nif]});

    // Query the database to get the evaluations
    const query = all ? `
        SELECT 
            id,
            target, 
            author, 
            decision,
            timestamp 
        FROM 
            evaluationsV
            JOIN officers author ON evaluationsV.author = author.nif
            JOIN officers requester ON requester.nif = ?
        ${filtersResult.query}
        LIMIT ${entries_per_page} 
        OFFSET ${(page - 1) * entries_per_page}
    ` : `
        SELECT
            id,
            target, 
            author, 
            decision,
            timestamp
        FROM
            evaluationsV
        ${filtersResult.query}
        LIMIT ${entries_per_page}
        OFFSET ${(page - 1) * entries_per_page}
    `
    const result = await queryDB(force, query, all ? [requester.nif, ...filtersResult.values] : filtersResult.values);

    // Query the database to fetch all rows that match the criteria
    const count_query = all ? `
        SELECT 
            COUNT(*) AS count
        FROM 
            evaluationsV
            JOIN officers author ON evaluationsV.author = author.nif
            JOIN officers requester ON requester.nif = ?
        ${filtersResult.query}
    ` : `
        SELECT
            COUNT(*) AS count
        FROM
            evaluationsV
        ${filtersResult.query}
    `

    const count_result = await queryDB(force, count_query, all ? [requester.nif, ...filtersResult.values] : filtersResult.values);

    // Return the evaluations
    const evaluations: MinifiedEvaluation[] = [];
    for (const row of result) {
        evaluations.push({
            id: row.id as number,
            target: row.target as number,
            author: row.author as number,
            decision: row.decision as number | null,
            timestamp: dateToUnix(row.timestamp as Date),
            average: (await queryDB(force, `SELECT CEILING(AVG(grade)) AS average FROM evaluations_data WHERE evaluation = ?`, [row.id]))[0].average as number
        });
    }

    return {
        pages: Math.ceil(count_result[0].count / entries_per_page),
        evaluations: evaluations
    };
}

export async function getAuthoredEvaluations(force: string, officer: number, routeValidFilters?: RouteFilterType, filters?: ReceivedQueryParams, page = 1, entries_per_page = 10): Promise<{
    pages: number,
    evaluations: MinifiedEvaluation[]
}> {
    if (filters && !routeValidFilters) throw new Error("routeValidFilters must be present when filters are passed");

    // Build the filters query and values
    const filtersResult = buildFiltersQuery(routeValidFilters!, filters, {subquery: "author = ?", value: officer});

    // Query the database to get the evaluations
    const result = await queryDB(force, `SELECT id, target, author, decision, timestamp FROM evaluationsV ${filtersResult.query} LIMIT ${entries_per_page} OFFSET ${(page - 1) * entries_per_page}`, filtersResult.values);

    // Query the database to get the count of total evaluations
    const count_result = await queryDB(force, `SELECT COUNT(*) AS count FROM evaluationsV ${filtersResult.query}`, filtersResult.values);

    // Return the evaluations
    const evaluations: MinifiedEvaluation[] = [];
    for (const row of result) {
        evaluations.push({
            id: row.id as number,
            target: row.target as number,
            author: row.author as number,
            decision: row.decision as number | null,
            timestamp: dateToUnix(row.timestamp as Date),
            average: (await queryDB(force, `SELECT CEILING(AVG(grade)) AS average FROM evaluations_data WHERE evaluation = ?`, [row.id]))[0].average as number
        });
    }

    return {
        pages: Math.ceil(count_result[0].count / entries_per_page),
        evaluations: evaluations
    };
}

export async function getEvaluationData(force: string, id: number): Promise<Evaluation | null> {
    // Get the basic data of the evaluation
    const basicQueryResult = await queryDB(force, `SELECT * FROM evaluationsV WHERE id = ?`, [id]);

    // Check if the evaluation exists
    if (basicQueryResult.length === 0) {
        return null;
    }

    // Get the fields of the evaluation
    const fieldsQueryResult = await queryDB(force, `SELECT field, grade, comments FROM evaluations_data WHERE evaluation = ?`, [id]);

    // * Parse the fields
    const fields: EvaluationBodyFieldsType = {};

    // Since the field column is unique, we can just iterate over the fieldsQueryResult
    for (const field of fieldsQueryResult) {
        fields[field.field as number] = {
            grade: field.grade as number,
            comments: field.comments as string | null
        };
    }

    return {
        id: basicQueryResult[0].id as number,
        target: basicQueryResult[0].target as number,
        author: basicQueryResult[0].author as number,
        patrol: basicQueryResult[0].patrol as number | null,
        comments: basicQueryResult[0].comments as string | null,
        decision: basicQueryResult[0].decision as number | null,
        timestamp: dateToUnix(basicQueryResult[0].timestamp as Date),
        fields: fields
    }
}

export async function updateEvaluationGrades(force: string, id: number, grades: EvaluationBodyFieldsType) {
    // Delete all data from the evaluation on the DB
    await queryDB(force, `DELETE FROM evaluations_data WHERE evaluation = ?`, [id]);

    // Insert the new data into the DB
    for (const field in grades) {
        await queryDB(force, `INSERT INTO evaluations_data (evaluation, field, grade, comments) VALUES (?, ?, ?, ?)`, [id, parseInt(field), grades[field].grade, grades[field].comments]);
    }
}

export async function addEvaluation(force: string, author: number, target: number, fields: EvaluationBodyFieldsType, patrol?: number, comments?: string, timestamp?: number): Promise<number> {
    // Insert the evaluation into the DB
    const result = await queryDB(force, `INSERT INTO evaluations (target, author, patrol, comments, timestamp) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))`, [target, author, patrol ?? null, comments ?? null, timestamp ?? null]);

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
        
        // If the timestamp field is present together with the patrol field, disregard the patrol field
        if (field === "timestamp" && changes.patrol) return acc;
        
        // Add the field to the query
        if (field === "timestamp") {
            return acc + `${field} = FROM_UNIXTIME(?), `;
        }
        return acc + `${field} = ?, `;
    }, "").slice(0, -2)} WHERE id = ?`;

    // Execute the query
    await queryDB(force, query, [...values, id]);

    // Update the fields in the DB, if they are present
    if (changes.fields) {
        await updateEvaluationGrades(force, id, changes.fields);
    }
}

export async function deleteEvaluation(force: string, id: number) {
    // Delete the evaluation from the DB
    await queryDB(force, `DELETE FROM evaluations WHERE id = ?`, [id]);
}