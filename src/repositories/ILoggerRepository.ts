
export default interface ILoggerRepository<T> {
    // save(ipt: T): Promise<void>
    log(ipt: T): Promise<void>
    queryAll(deviceId: string): Promise<T[]>
}