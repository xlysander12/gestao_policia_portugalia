export interface RequestSuccess {
    message: string;
}

export interface RequestError {
    message: string;
    code?: string;
}