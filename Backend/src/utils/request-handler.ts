/**
 * @deprecated This method should no longer be used as types are now handled by the ExpressAPI itself
 */
export function ensureAPIResponseType<T>(body: T): T {
    return body;
}