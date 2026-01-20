import {DefaultReturn, InnerOfficerData} from "../../../../../types";
import {MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import {
    addEvaluation,
    deleteEvaluation,
    editEvaluation, evaluationHasPatrol,
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
import {getEvaluationFields, getForcePatents} from "../../../../util/repository";
import {PatentData} from "@portalseguranca/api-types/util/output";
import {dateToUnix} from "../../../../../utils/date-handler";
import {Optional} from "runtypes";

export async function evaluationsList(force: string, requester: InnerOfficerData, target: number, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1): Promise<DefaultReturn<{
    pages: number,
    evaluations: MinifiedEvaluation[],
    averages: Record<number | "decision", number> | Record<number, number>
}>> {
    // Check if the requester has the "evaluations" intent
    const hasIntent = await userHasIntents(requester.nif, force, "evaluations");

    // Fetch the evaluations from the repository
    const {pages, evaluations} = await getEvaluations(force, requester, target, hasIntent, routeValidFilters, filters, page);

    // * Calculate the averages for each present field of the evaluations
    // Get all evaluations from the filters, without any pagination
    const allEvals = (await getEvaluations(force, requester, target, hasIntent, routeValidFilters, filters, 0)).evaluations;

    // Store all grades for each field
    const field_grades: Record<number | "decision", number[]> = {"decision": []};

    // Loop through all evaluations
    for (const evaluation of allEvals) {
        // Fetch the complete evaluation data
        const evaluationData = (await getEvaluationData(force, evaluation.id))!;

        // Loop through all fields
        for (const field in evaluationData.fields) {
            // If the field doesn't exist in the object, create it
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!field_grades[field]) {
                field_grades[field] = [];
            }

            // Add the grade to the field
            field_grades[field].push(evaluationData.fields[field].grade);
        }
        
        // Add the decision, if exists
        if (evaluationData.decision !== null) field_grades.decision.push(evaluationData.decision);
    }

    // Calculate the pondered average for each field
    // This calculation will be done by the following expression:
    // (For every grade g in the field => g * (arr.size() - index)) / (Sum of all indexes)
    const averages: Record<number | "decision", number> | Record<number, number> = {};
    for (const field in field_grades) {
        // Get the sum of all grades multiplied by their weight (weight = arr.size() - index)
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
        averages[field] = Math.round(sum / indexesSum);
    }

    // Return the evaluations
    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso",
        data: {
            pages,
            evaluations,
            averages
        }
    }
}

export async function authoredEvaluationsList(force: string, loggedOfficer: InnerOfficerData, officer: number, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams, page = 1): Promise<DefaultReturn<{
    pages: number,
    evaluations: MinifiedEvaluation[],
}>> {
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

        const author = await getOfficerData(officer, force, false, false) ?? await getOfficerData(officer, force, true, false);

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
    // * If the target officer has a greater patent than the one the logged officer can evaluate, this evaluation cannot be created
    // Get the logged officer's patent data
    const loggedOfficerPatent = await getForcePatents(force, loggedOfficer.patent) as PatentData;

    if (targetOfficer.patent > loggedOfficerPatent.max_evaluation) {
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

        // Check if there isn't any other evaluation with this patrol associated
        const result = await evaluationHasPatrol(force, loggedOfficer.nif, targetOfficer.nif, patrol.id);

        // If there is an evaluation with this patrol already associated, another one cannot be done
        if (result) {
            return {
                result: false,
                status: 400,
                message: `Já existe uma avaliação com esta patrulha associada (#${result.id})`
            }
        }
    } else {
        // Make sure the provided timestamp is not in the future
        if (dateToUnix(new Date()) < details.timestamp!) {
            return {
                result: false,
                status: 400,
                message: "Não é possível fazer uma avaliação do futuro"
            }
        }
    }

    // * Loop through every given field and check if the target can be evaluated by it
    // Get all force fields from the DB
    const allFields = await getEvaluationFields(force);
    for (const field of Object.keys(details.fields)) {
        const foundField = allFields.find((allF) => allF.id === parseInt(field));

        // If this field wasn't found, return an error
        if (!foundField) {
            return {
                result: false,
                status: 400,
                message: "Campo de avaliação fornecido inválido"
            }
        }

        if (foundField.starting_patent > targetOfficer.patent) {
            return {
                result: false,
                status: 400,
                message: "Este efetivo não pode ser evaliado sob este campo de avaliação"
            }
        }
    }

    // Apply the data in the repository
    await addEvaluation(force, loggedOfficer.nif, targetOfficer.nif, details.fields, details.patrol, details.comments, details.decision, details.patrol ? undefined : details.timestamp);

    return {
        result: true,
        status: 200,
        message: "Operação realizada com sucesso"
    }
}

export async function updateEvaluation(force: string, loggedOfficer: InnerOfficerData, evaluation: InnerOfficerEvaluation, details: EditEvaluationBodyType): Promise<DefaultReturn<void>> {
    // If the target officer is not the author of the evaluation, return an error
    if (evaluation.author !== loggedOfficer.nif) {
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

        // Check if there isn't any other evaluation with this patrol associated
        const result = await evaluationHasPatrol(force, loggedOfficer.nif, evaluation.target, patrol.id);

        // If there is an evaluation with this patrol already associated, another one cannot be done
        if (result && result.id !== evaluation.id) {
            return {
                result: false,
                status: 400,
                message: `Já existe uma avaliação com esta patrulha associada (#${result.id})`
            }
        }
    } else {
        // Make sure the provided timestamp is not in the future
        if (dateToUnix(new Date()) < details.timestamp!) {
            return {
                result: false,
                status: 400,
                message: "Não é possível fazer uma avaliação do futuro"
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

    // * Loop through every given field and check if the target can be evaluated by it, if fields were given
    if (details.fields) {
        // Get all force fields from the DB
        const allFields = await getEvaluationFields(force);
        const targetOfficer = await getOfficerData(evaluation.target, force, false, false) ??
            await getOfficerData(evaluation.target, force, true, false);

        if (!targetOfficer) {
            return {
                result: false,
                status: 400,
                message: "Efetivo não encontrado"
            }
        }

        for (const field of Object.keys(details.fields)) {
            const foundField = allFields.find((allF) => allF.id === parseInt(field));

            // If this field wasn't found, return an error
            if (!foundField) {
                return {
                    result: false,
                    status: 400,
                    message: "Campo de avaliação fornecido inválido"
                }
            }

            if (foundField.starting_patent > targetOfficer.patent) {
                return {
                    result: false,
                    status: 400,
                    message: "Este efetivo não pode ser evaliado sob este campo de avaliação"
                }
            }
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