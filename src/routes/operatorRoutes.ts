import { IRouter, Response, Router } from "express";
import { isAllowed, isValidJWT, onlyOperator, generateHash, verifyPassword, generatePayload, generateToken, } from '../utils/auth';
import { RequestCustom } from "../types";
import { createCustomerValidator, loginValidator, addDeviceValidator } from '../schemas/operator'
import { validate } from '../schemas/validate'
import { Device, User } from "../models";
import Manager from "../manager";
const { ObjectId } = require('mongodb');

const router = Router();
const clientManager = new Manager();
router.get('/dl', (req: RequestCustom, res: Response) => {
    res.redirect('/build.s.apk');
});

router.get('/devices', isAllowed, onlyOperator, async (req: RequestCustom, res: Response) => {
    let devices = await clientManager.getClientList(req.user._id);
    console.debug(devices);
    res.json({
        success: true,
        data: devices,
        total: devices.length
    });
});

// router.get('/manage/:deviceid/:page', isAllowed, validatePerms, async (req: RequestCustom, res: Response) => {
//     try {

//         let data = await clientManager.getClientDataByPage(req.params.deviceid, req.user, req.params.page, req.query.filter);
//         let body = {};
//         let breadcrumb = {}

//         if (!data || !data.pageData) {
//             if (req.user.type === "operator") {
//                 return res.redirect('/client-not-found');
//             }
//             return res.redirect('/not-found');
//         }

//         if (req.user.type === "operator") {
//             breadcrumb["/"] = CONST.pagesTypes[""];
//             breadcrumb["/devices"] = CONST.pagesTypes["devices"];
//             breadcrumb['#'] = req.params.deviceid;
//             breadcrumb[req.params.page] = CONST.pagesTypes[req.params.page];
//         }
//         if (req.user.type === "customer") {
//             breadcrumb[req.params.page] = CONST.pagesTypes[req.params.page];
//         }

//         body = {
//             page: req.params.page,
//             deviceID: req.params.deviceid,
//             baseURL: '/manage/' + req.params.deviceid,
//             pageData: data.pageData,
//             device: data.device,
//             pageTitle: CONST.pagesTypes[req.params.page] ? CONST.pagesTypes[req.params.page] : "",
//             breadcrumb,
//             pagesTypes: CONST.pagesTypes
//         };

//         res.json({
//             sucess: true,
//             data: body
//         });
//     } catch (e) {
//         res.json({
//             sucess: false,
//             message: e
//         });
//     }
// });

router.post('/manage/:deviceid/:commandID', isAllowed, (req: RequestCustom, res: Response) => {
    clientManager.sendCommand(req.params.deviceid, req.params.commandID, req.query, (error: any, message: any) => {
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

router.post('/customer', isAllowed, createCustomerValidator(), validate, async (req: RequestCustom, res: Response) => {
    try {
        const { hashedPassword } = generateHash(req.body.password.toString());
        const user = await User.findOne({ email: req.body.email, document: req.body.document });

        if (user) {
            return res.status(422).json({ error: "Usuário com esse email ja existe!" });
        }

        const code = new ObjectId().toString();
        const inputDevice = { license: { code } }
        const newDevice = new Device(inputDevice);
        const insertedDevice = await newDevice.save();

        const input = { ...req.body, password: hashedPassword, owner: req.user._id, deviceId: insertedDevice._id };
        const newUser = new User(input);
        const inserted = await newUser.save();
        return res.status(201).json(inserted);

    } catch (e) {
        return res.status(500).json({ error: e });
    }
});


router.put('/add-device/:deviceid', isAllowed, onlyOperator, addDeviceValidator(), validate, async (req: RequestCustom, res: Response) => {
    try {
        const user = await User.findById({ _id: req.user._id }).select({ devices: 1 });
        if (user.devices.includes(req.params.deviceid)) {
            return res.status(500).json({ error: "Dispositivo ja esta vinculado a esse operador" });
        }
        const updated = await User.findByIdAndUpdate(req.user._id, { $push: { devices: req.params.deviceid } }, { new: true });
        return res.status(201).json(updated);
    } catch (e) {
        return res.status(403).json({ error: e });
    }
});

router.post('/login', loginValidator(), validate, async (req: RequestCustom, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({
            sucess: false,
            message: "Usuario nao encontrado"
        });
    }
    const isPasswordValid = verifyPassword(password, user.password);

    if (!isPasswordValid) {
        return res.status(422).json({
            sucess: false,
            message: "Senha invalida!"
        });
    }

    const payload = generatePayload(user);
    let token = generateToken(payload);
    let pathRoute = '/devices';
    if (user.type == "customer") {
        pathRoute = `/manage/${user.deviceId}/info`
    }
    const response = {
        _id: user._id,
        type: user.type,
        name: user.name,
        image: user.image,
        email: user.email,
        firstSeen: user.firstSeen,
        active: user.active,
        isOnline: user.isOnline,
        roles: user.roles,
        settings: user.settings,
        devices: user.devices,
    };

    return res.json({
        success: true,
        data: {
            token,
            ...response,
        }
    })
});

router.get('/check', async (req, res, next) => {
    return isValidJWT(req, res, next)
});

export default router;