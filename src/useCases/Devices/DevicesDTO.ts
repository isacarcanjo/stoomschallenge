import { Response } from "express"
import { RequestCustom } from "../../types"

export interface IDevicesController  {
    findAll(req: RequestCustom, res: Response): Promise<Response>
}
    