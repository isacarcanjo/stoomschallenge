export default interface ILog {
    _id?: string,
    deviceId: string,
    clientId: string,
    createdAt?: Date,
    type: Object,
    message?: string,
}