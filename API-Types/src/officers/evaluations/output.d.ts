import {BaseResponse, SocketResponse} from "../../index";

export interface MinifiedEvaluation {
    id: number
    target: number
    author: number
    decision: number | null
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
        pages: number
        averages: {
            [field: number]: number
        }
    }
    data: MinifiedEvaluation[]
}

export interface AuthoredEvaluationsListResponse extends BaseResponse {
    meta: {
        pages: number
    }
    data: MinifiedEvaluation[]
}

export interface EvaluationDetailResponse extends BaseResponse {
    data: Evaluation
}

export interface EvaluationSocket extends SocketResponse {
    target: number
    author: number
}

export interface AddEvaluationSocket extends EvaluationSocket {
    action: "add"
}

export interface UpdateEvaluationSocket extends EvaluationSocket {
    action: "update"
    id: number
}

export interface DeleteEvaluationSocket extends EvaluationSocket {
    action: "delete"
    id: number
}