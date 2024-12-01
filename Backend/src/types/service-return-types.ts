export interface DefaultReturn<Type> {
    result: boolean,
    status: number,
    message?: string
    data?: Type
}