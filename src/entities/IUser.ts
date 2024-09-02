import { ObjectId } from "mongoose"

interface IUserSettings {
    enabledPermissions: Array<object>
    notify: boolean,
}
interface IUserApps {
    appName: string,
    packageName: string,
    versionName: string,
    versionCode: number,
}
interface IUserClipboardLog {
    time: Date
    content: string,
}
interface IUserCurrentFolder {
    name: string,
    isDir: boolean,
    path: string,    
}

export default interface IUser {
    _id?: string,
    deviceId?: string
    type: string, // customer / operator/ admin
    owner: string // case, wil be customer
    name: string,
    email: string,
    document: string,
    birthDate: string,
    password: string,
    firstSeen: Date,
    lastSeen: Date,
    createdBy: ObjectId,
    image: string,
    active: boolean,
    isOnline: boolean,
    devices?: [string],
    roles: Array<object>,
    settings: IUserSettings,
    enabledPermissions?: Array<string>, // String list
    apps?: IUserApps,
    clipboardLog?: IUserClipboardLog,
    currentFolder?: IUserCurrentFolder
}