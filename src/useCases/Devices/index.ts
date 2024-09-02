import { DevicesController } from "./DevicesController";
    
export const makeDevicesController = (): DevicesController => {
    const controller = new DevicesController()
    return controller
}