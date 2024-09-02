import { Config } from "../config";

export enum EApp {
    PREFIX = `/api/${Config.API_VERSION}`
}

export enum EMessageKeys {
    camera = '0xCA',
    files = '0xFI',
    call = '0xCL',
    sms = '0xSM',
    mic = '0xMI',
    location = '0xLO',
    contacts = '0xCO',
    wifi = '0xWI',
    notification = '0xNO',
    clipboard = '0xCB',
    installed = '0xIN',
    permissions = '0xPM',
    gotPermission = '0xGP'
}

export var LogTypes = {
    error: {
        name: 'ERROR',
        color: 'red'
    },
    alert: {
        name: 'ALERT',
        color: 'amber'
    },
    success: {
        name: 'SUCCESS',
        color: 'limegreen'
    },
    info: {
        name: 'INFO',
        color: 'blue'
    }
}