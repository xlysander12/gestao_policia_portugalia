export interface QueryBundle<ReturnType = unknown> {
    queryfn: () => Promise<ReturnType>
    queryKeys: readonly unknown[]
}