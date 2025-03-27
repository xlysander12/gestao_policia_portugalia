import {DefaultReturn} from "../../../../../types";
import {MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {getEvaluationData, getEvaluations} from "../repository";
import {RouteFilterType} from "../../../../routes";
import {ReceivedQueryParams} from "../../../../../utils/filters";

export async function evaluationsList(force: string, requester: number, target: number, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams): Promise<DefaultReturn<{
    evaluations: MinifiedEvaluation[],
    averages: {
        [field: number]: number
    }
}>> {
    // Fetch the evaluations from the repository
    const evaluations = await getEvaluations(force, requester, target, routeValidFilters, filters);

    // * Calculate the averages for each present field of the evaluations
    // Store all grades for each field
    const field_grades: {[field: number]: number[]} = {};

    // Loop through all evaluations
    for (const evaluation of evaluations) {
        // Fetch the complete evaluation data
        const evaluationData = (await getEvaluationData(force, evaluation.id))!;

        // Loop through all fields
        for (const field in evaluationData.fields) {
            // If the field doesn't exist in the object, create it
            if (!field_grades[field]) {
                field_grades[field] = [];
            }

            // Add the grade to the field
            field_grades[field].push(evaluationData.fields[field]);
        }
    }

    // Calculate the pondered average for each field
    // This calculation will be done by the following expression:
    // (For every grade g in the field => g * (arr.size() - index)) / (Sum of all indexes)
    const averages: {[field: number]: number} = {};
    for (const field in field_grades) {
        // Get the sum of all grades multiplied by their wheigth (wheigth = arr.size() - index)
        let sum = 0;
        for (let i = 0; i < field_grades[field].length; i++) {
            sum += field_grades[field][i] * (field_grades[field].length - i);
        }

        // Calculate the sum of all indexes
        let indexesSum = 0;
        for (let i = 1; i <= field_grades[field].length; i++) {
            indexesSum += i;
        }

        // Calculate the average
        averages[parseInt(field)] = Math.round(sum / indexesSum);
    }

    // Return the evaluations
    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso",
        data: {
            evaluations,
            averages: averages
        }
    }
}