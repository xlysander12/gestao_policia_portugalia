import {DefaultReturn, InnerOfficerData} from "../../../../../types";
import {MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {
    addEvaluation,
    deleteEvaluation,
    editEvaluation,
    getAuthoredEvaluations,
    getEvaluationData,
    getEvaluations
} from "../repository";
import {RouteFilterType} from "../../../../routes";
import {ReceivedQueryParams} from "../../../../../utils/filters";
import {userHasIntents} from "../../../../accounts/repository";
import {CreateEvaluationBodyType, EditEvaluationBodyType} from "@portalseguranca/api-types/officers/evaluations/input";
import {InnerOfficerEvaluation} from "../../../../../types/inner-types";
import {getPatrol} from "../../../../patrols/repository";
import {getOfficerData} from "../../../repository";

export async function evaluationsList(force: string, requester: InnerOfficerData, target: number, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams, page: number = 1): Promise<DefaultReturn<{
    evaluations: MinifiedEvaluation[],
    averages: {
        [field: number]: number
    }
}>> {
    // Fetch the evaluations from the repository
    const evaluations = await getEvaluations(force, requester, target, await userHasIntents(requester.nif, force, "evaluations"), routeValidFilters, filters, page);

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

export async function authoredEvaluationsList(force: string, loggedOfficer: InnerOfficerData, officer: number, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams, page: number = 1): Promise<DefaultReturn<MinifiedEvaluation[]>> {
    // If the logged officer isn't the same as the target officer, a few checks need to be done
    // - The requesting officer must have the "evaluations" intent
    // - The author officer cannot be higher patent than the requesting officer
    if (loggedOfficer.nif !== officer) {
        if (!(await userHasIntents(loggedOfficer.nif, force, "evaluations"))) {
            return {
                result: false,
                status: 403,
                message: "Não tens permissões para aceder a esta informação"
            }
        }

        let author = await getOfficerData(officer, force, false, false);
        if (!author) {
            author = await getOfficerData(officer, force, true, false);
        }

        if (!author) {
            return {
                result: false,
                status: 404,
                message: "Efetivo não encontrado"
            }
        }

        if (loggedOfficer.patent < author.patent) {
            return {
                result: false,
                status: 403,
                message: "Não tens permissão para aceder a esta informação"
            }
        }
    }

    // Fetch the evaluations from the repository
    const result = await getAuthoredEvaluations(force, officer, routeValidFilters, filters, page);

    // Return the result
    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso",
        data: result
    }
}

export async function createEvaluation(force: string, loggedOfficer: InnerOfficerData, targetOfficer: InnerOfficerData, details: CreateEvaluationBodyType): Promise<DefaultReturn<void>> {
    // If the target officer has a greater or equal patent than the logged officer, this evaluation cannot be created
    if (targetOfficer.patent >= loggedOfficer.patent) {
        return {
            result: false,
            status: 403,
            message: "Não tens permissões para criar uma avaliação a este efetivo"
        }
    }

    // If the body doesn't have a patrol, timestamp must be present
    if (!details.patrol && !details.timestamp) {
        return {
            result: false,
            status: 400,
            message: "É obrigatório colocar uma data de avaliação quando não é associada nenhuma patrulha"
        }
    }

    // * If a patrol is provided, this patrol must have both the loggedOfficer and the targetOfficer present
    if (details.patrol) {
        // Get the patrol data
        const patrol = await getPatrol(force, `${force}${details.patrol}`);

        // If the patrol doesn't exist, return an error
        if (!patrol) {
            return {
                result: false,
                status: 404,
                message: "Patrulha não existente"
            }
        }

        // Check if the logged officer is present in the patrol
        if (!patrol.officers.includes(loggedOfficer.nif)) {
            return {
                result: false,
                status: 403,
                message: "Não podes associar uma patrulha em que não estás presente"
            }
        }

        // Check if the target officer is present in the patrol
        if (!patrol.officers.includes(targetOfficer.nif)) {
            return {
                result: false,
                status: 403,
                message: "Não podes associar uma patrulha em que não estiveste com o efetivo"
            }
        }
    }

    // Apply the data in the repository
    await addEvaluation(force, loggedOfficer.nif, targetOfficer.nif, details.fields, details.patrol, details.comments, details.timestamp);

    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso"
    }
}

export async function updateEvaluation(force: string, loggedOfficer: InnerOfficerData, evaluation: InnerOfficerEvaluation, details: EditEvaluationBodyType): Promise<DefaultReturn<void>> {
    // If the target officer is not the author of the evaluation and he doesn't have the "evaluations" intent, return an error
    if (evaluation.author !== loggedOfficer.nif && !(await userHasIntents(loggedOfficer.nif, force, "evaluations"))) {
        return {
            result: false,
            status: 403,
            message: "Não tens permissões para editar esta avaliação"
        }
    }

    // * If a patrol is provided, this patrol must have both the loggedOfficer and the targetOfficer present
    if (details.patrol) {
        // Get the patrol data
        const patrol = await getPatrol(force, `${force}${details.patrol}`);

        // If the patrol doesn't exist, return an error
        if (!patrol) {
            return {
                result: false,
                status: 404,
                message: "Patrulha não existente"
            }
        }

        // Check if the logged officer is present in the patrol
        if (!patrol.officers.includes(loggedOfficer.nif)) {
            return {
                result: false,
                status: 403,
                message: "Não podes associar uma patrulha em que não estás presente"
            }
        }

        // Check if the target officer is present in the patrol
        if (!patrol.officers.includes(evaluation.target)) {
            return {
                result: false,
                status: 403,
                message: "Não podes associar uma patrulha em que não estiveste com o efetivo"
            }
        }
    }

    // If the changes are empty, return success
    if (Object.keys(details).length === 0) {
        return {
            result: true,
            status: 200,
            message: "Operação realizada com sucesso"
        }
    }

    // Apply the data in the repository
    await editEvaluation(force, evaluation.id, details);

    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso"
    }
}

export async function deleteEvaluationService(force: string, loggedOfficer: InnerOfficerData, evaluation: InnerOfficerEvaluation): Promise<DefaultReturn<void>> {
    // If the target officer is not the author of the evaluation and he doesn't have the "evaluations" intent, return an error
    if (evaluation.author !== loggedOfficer.nif && !(await userHasIntents(loggedOfficer.nif, force, "evaluations"))) {
        return {
            result: false,
            status: 403,
            message: "Não tens permissões para eliminar esta avaliação"
        }
    }

    // Apply the data in the repository
    await deleteEvaluation(force, evaluation.id);

    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso"
    }
}