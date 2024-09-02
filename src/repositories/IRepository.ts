export default interface IRepository<T> {
    queryAll(): Promise<T[]>
}