export interface RequestSuccess {
    message: string;
}

export interface RequestError extends RequestSuccess{
    code?: string;
}