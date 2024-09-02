import { IDevicesController } from "./DevicesDTO";
import { RequestCustom } from "../../types";
import { Response } from "express";
import { exception } from "../../utils/api";
import { Device, User } from "../../models";
import IDevice from "../../entities/IDevice";
import IUser from "../../entities/IUser";

/** 
* The class to exists methods
*/
export class DevicesController implements IDevicesController {
    constructor(
    ) { }

    async findAll(req: RequestCustom, res: Response): Promise<Response> {
        try {
            const idUser = req.user._id;
            const user: IUser = await User.findById(idUser);

            if (!user) {
                throw new Error("Usuario nao encontrado")
            }
            const devices: Array<IDevice> = await Device.find({ _id: { $in: user?.devices } }).sort({ "license.activated": -1, isOnline: -1, lastSeen: -1 }) || [];
            console.debug(devices);
            return res.json({
                success: true,
                data: devices,
                total: devices.length
            });
        } catch (e) {
            return exception(res, e);
        }
    }
}