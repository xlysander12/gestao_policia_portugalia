export interface QueryBundle {
    queryfn: () => Promise<unknown>
    queryKeys: string[] | (() => string[])
}