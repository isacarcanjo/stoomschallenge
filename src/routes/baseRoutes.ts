import { Response, Router } from "express";

import { isAllowed, onlyOperator, } from '../utils/auth';
import { RequestCustom } from "../types";
import { Device, User } from "../models";
let clientManager = global.clientManager;

const router = Router();

router.get('/devices', isAllowed, onlyOperator, async (req: RequestCustom, res: Response) => {
    const idUser = req.user._id;
    const user = await User.findById(idUser);

    if (!user) {
        throw new Error("Usuario nao encontrado")
    }
    const devices = await Device.find({ _id: { $in: user?.devices } }).sort({ "license.activated": -1, isOnline: -1, lastSeen: -1 });
    
    console.debug(devices);
    res.json({
        success: true,
        data: devices,
        total: devices.length
    });

});

router.get('/manage/:deviceid/:page', isAllowed, validatePerms, async (req: RequestCustom, res: Response) => {
    try {

        let data = await clientManager.getClientDataByPage(req.params.deviceid, req.user, req.params.page, req.query.filter);
        let body = {};
        let breadcrumb = {}

        if (!data || !data.pageData) {
            if (req.user.type === "operator") {
                return res.redirect('/client-not-found');
            }
            return res.redirect('/not-found');
        }

        if (req.user.type === "operator") {
            breadcrumb["/"] = CONST.pagesTypes[""];
            breadcrumb["/devices"] = CONST.pagesTypes["devices"];
            breadcrumb['#'] = req.params.deviceid;
            breadcrumb[req.params.page] = CONST.pagesTypes[req.params.page];
        }
        if (req.user.type === "customer") {
            breadcrumb[req.params.page] = CONST.pagesTypes[req.params.page];
        }

        body = {
            page: req.params.page,
            deviceID: req.params.deviceid,
            baseURL: '/manage/' + req.params.deviceid,
            pageData: data.pageData,
            device: data.device,
            pageTitle: CONST.pagesTypes[req.params.page] ? CONST.pagesTypes[req.params.page] : "",
            breadcrumb,
            pagesTypes: CONST.pagesTypes
        };

        res.json({
            sucess: true,
            data: body
        });
    } catch (e) {
        res.json({
            sucess: false,
            message: e
        });
    }
});

router.post('/manage/:deviceid/:commandID', isAllowed, (req: RequestCustom, res: Response) => {
    clientManager.sendCommand(req.params.deviceid, req.params.commandID, req.query, (error, message) => {
        if (!error) res.json({ error: false, message })
        else res.json({ error })
    });
});

router.post('/manage/:deviceid/GPSPOLL/:speed', isAllowed, (req: RequestCustom, res: Response) => {
    clientManager.setGpsPollSpeed(req.params.deviceid, parseInt(req.params.speed), (error) => {
        if (!error) res.json({ error: false })
        else res.json({ error })
    });
});

router.post('/manage/:deviceid/settings/gps', isAllowed, (req: RequestCustom, res: Response) => {
    const { areasEnable, updateFrequency } = req.body

    const input = {
        updateFrequency: parseInt(updateFrequency),
        areasEnable: Boolean(areasEnable),
    }
    clientManager.updateDeviceSettings(req.params.deviceid, input, (error) => {
        if (!error) res.json({ error: false })
        else res.json({ error })
    });
});

router.post('/manage/:deviceid/settings/gps/areas', isAllowed, (req: RequestCustom, res: Response) => {
    const { areas } = req.body;
    const newAreas = Object.values(areas || []);

    const ipt = {
        areas: newAreas,
    }

    clientManager.updateDeviceAreas(req.params.deviceid, ipt, (error, data = []) => {
        if (!error) res.json({ error: false, data })
        else res.json({ error })
    });
});

export default router;