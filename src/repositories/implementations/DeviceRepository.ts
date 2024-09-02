import IDevice from "../../entities/IDevice";
import { Device } from "../../models";

export class DeviceRepository {
    opt = {
        active: 1,
        gpsSettings: 1,
        areasEnable: 1,
        areas: 1,
        name: 1,
        model: 1,
        manufacture: 1,
        version: 1,
        alerts: 1,
    }
    async findBySecret(secret: String): Promise<IDevice> {
        const device = await Device.findOne({ secret: secret });
        return device;
    }
    async findById(id: String, select = {}): Promise<IDevice> {
        const device = await Device.findById(id).select(select);
        return device;
    }
    async checkMobile(id: String): Promise<IDevice> {
        const device = await Device.findById(id).select(this.opt);
        return device;
    }
    async disable(id: String): Promise<void> {
        await Device.findByIdAndUpdate(id, { active: false, disabledAt: new Date() });
    }
    async updateRealId(id: String, realId: string): Promise<void> {
        await Device.findByIdAndUpdate(id, { realId: realId });
    }
}
