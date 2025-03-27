import {BaseResponse} from "../../index";

export interface MinifiedEvaluation {
    id: number
    target: number
    author: number
    timestamp: number
    average: number
}

export interface Evaluation extends Omit<MinifiedEvaluation, "average"> {
    patrol: number | null
    comments: string | null
    fields: {
        [field: number]: number
    }
}

export interface EvaluationsListResponse extends BaseResponse {
    meta: {
        averages: {
            [field: number]: number
        }
    }
    data: MinifiedEvaluation[]
}

export interface AuthoredEvaluationsListResponse extends BaseResponse {
    data: MinifiedEvaluation[]
}

export interface EvaluationDetailResponse extends BaseResponse {
    data: Evaluation
}