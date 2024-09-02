

interface ILicenseDevice {
    code: String,
    createdAt: Date,
    activated: boolean,
    expiresIn: Date,
}
interface IGpsSettingsDevice {
    updateFrequency: number,
}
interface IGpsSettingsDevice {
    clientIP: String
    clientGeo: {
        range: [Number],
        country: String, default: ""
        region: String
        eu: String,
        timezone: String,
        city: String,
        ll: [Number],
        metro: Number,
        area: Number
    }
}

export interface ICommand {
    type: string,
    userId: string,
    createdAt: Date
}

export interface DevicePayload {
    _id?: string,
    clientId: string,
    realId?: string,
    active: boolean,
    gpsSettings: IGpsSettingsDevice,
    areasEnable: boolean,
    areas: Array<object>,
    name: string,
    model: string,
    manufacture: string,
    version: string,
    alerts: Array<object>,
}
export interface IFolder {
    name: string,
    isDir: boolean,
    path: string,
}
export default interface IDevice {
    clientId: string,
    realId?: string,
    name: string,
    model: string,
    manufacture: string,
    version: string,
    firstSeen: Date,
    disabledAt: Date,
    lastSeen: Date,
    active: boolean,
    deletedAt: Date,
    isOnline: boolean,
    alerts: Array<object>,
    license: ILicenseDevice,
    gpsSettings: IGpsSettingsDevice,
    areasEnable: boolean,
    areas: object,
    dynamicData: IGpsSettingsDevice,
    commands: Array<ICommand>,
    currentFolder: Array<IFolder>,
    wifi: Array<IWifi>,
    enabledPermissions: Array<string>,
    apps: Array<IApps>
}

export interface IApps {
    appName: string,
    packageName: string,
    versionName: string,
    versionCode: number
}
export interface IWifi {
    BSSID: String,
    SSID: String,
    firstSeen: Date,
    lastSeen: Date,
    createdAt: Date,
} 