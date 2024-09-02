import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { User, } from "../models";
import { NextFunction, Request, Response } from 'express';
import { Config } from '../config';
import IUser from '../entities/IUser';
import { DeviceRepository } from '../repositories/implementations/DeviceRepository';
// Função para gerar um salt aleatório
function generateSalt(length: number) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Função para criar um hash com uma senha e salt
function generateHash(password: string) {
    const salt = Config.SECRET_SALT;
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const hashedPassword = hash.digest('hex');
    return {
        salt,
        hashedPassword
    };
}


// function salts(type = "customer") {
//     let salt;
//     switch (type) {
//         case "customer":
//             salt = Config.SECRET_SALT;
//             break;
//         case "operator":
//             salt = Config.SECRET_SALT;
//             break;
//         case "admin":
//             salt = Config.SECRET_SALT_ADMIN;
//             break;
//     }
//     return salt
// }

function verifyPassword(password: string, hashedPassword: string) {
    const salt = Config.SECRET_SALT;
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const hashedPasswordAttempt = hash.digest('hex');
    // console.log(hashedPasswordAttempt, hashedPassword)
    return hashedPassword === hashedPasswordAttempt;
}

function generateMobileToken(payload: object) {
    const token = Config.SECRET_TOKEN_MOBILE
    return jwt.sign(payload, token, {
        expiresIn: `${Config.ACCESS_TOKEN_DURATION_MINUTES}m`
    });
    // return crypto.createHash('md5').update((Math.random()).toString() + (new Date()).toString()).digest("hex");
}

// Ele è usado para gerar QRCODE no front, è usado apenas uma vez por cada device, 
// apos autentica pela primeira vez, ele usa o novo token de refresh gerado.
// Esse token so tem permissao de gerar outro e gravar dados iniciais.
async function verifyMobileToken(token: string, realId: string) {
    const secret = Config.SECRET_TOKEN_MOBILE;
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, async (err, decoded) => {
            // if (!err && typeof decoded === 'object' && decoded !== null) return decoded;
            try {
                const payload = jwt.decode(token);

                if (payload?.first && !err) {
                    let res = await authMobile(decoded, realId, true);
                    return resolve(res);
                }
                if (err.name === 'TokenExpiredError') {
                    if (typeof decoded !== 'object' && decoded === null) return reject(null);
                    if (payload?.first) return reject(null);
                    let res = await authMobile(decoded, realId);
                    return resolve(res);
                }
                return reject(new Error('Erro na autenticação'));
            } catch (e) {
                return reject(e);
            }
        });
    });
}

async function authMobile(decoded: any, realId: string, first: boolean = false) {
    const deviceRepository = new DeviceRepository();

    const id = decoded?._id;
    const device = await deviceRepository.checkMobile(id);

    if (!device) return null;
    if (deviceExpires(device.license.expiresIn)) {
        await deviceRepository.disable(id);
        return null;
    }
    if (device?.disabledAt) {
        throw new Error('DESATIVAR');
    }
    const ipt = {
        realId: realId,
        first: false, // colocar first=true no primeiro token la no front.
        ...device
    }
    if (first) {
        await deviceRepository.updateRealId(id, realId);
    }
    const newPayload = generateMobileToken(ipt);
    return newPayload;
}

function deviceExpires(expiresIn) {
    const currentDate = new Date();
    return currentDate > expiresIn;
}

function generateToken(payload: object) {
    const token = Config.SECRET_TOKEN
    return jwt.sign(payload, token, {
        // audience: 'urn:jwt:type:access',
        // issuer: 'urn:system:token-issuer:type:access',
        expiresIn: `${Config.ACCESS_TOKEN_DURATION_MINUTES}m`
    });
    // return crypto.createHash('md5').update((Math.random()).toString() + (new Date()).toString()).digest("hex");
}


const authMiddleware = (secret: string, req, res, next: NextFunction) => {
    const token = getToken(req, res);
    if (!token) {
        return res.sendStatus(401);
    }
    try {
        const data = jwt.verify(token, secret);
        req.user = data;
        return next();
    } catch {
        return res.sendStatus(401);
    }
}
const getToken = (req, res) => {
    if (!req?.headers?.authorization) return res.sendStatus(401)
    const auth = req?.headers?.authorization?.split(' ')
    const token = auth[auth.length - 1];
    return token;
}

const check = (secret, req, res) => {
    const token = getToken(req, res);
    if (!token) {
        return res.sendStatus(422)
    }
    try {
        const user = jwt.verify(token, secret);
        return res.json({
            success: true,
            data: user,
        });
    } catch (e) {
        return res.sendStatus(422)
    }
}

const onlyOperator = (req, res, next) => {
    if (req.user.type === "customer") {
        return res.redirect("not-found");
    }
    return next();
}

const isAllowed = (req, res, next) => {
    return authMiddleware(Config.SECRET_TOKEN, req, res, next)
};
const isValidJWT = (req, res, next) => {
    return check(Config.SECRET_TOKEN, req, res)
};
const isAllowedAdmin = (req, res, next) => {
    return authMiddleware(Config.SECRET_TOKEN_ADMIN, req, res, next)
};

const generatePayload = (user: IUser) => {
    const { _id, deviceId, devices, type, image, name, email, document, firstSeen, lastSeen, active, isOnline, roles, settings } = user;
    const payload: Payload = { type, _id: _id.toString(), image, name, email, firstSeen, lastSeen, active, isOnline, roles, settings };

    if (document) {
        payload.document = document;
    }
    if (deviceId) {
        payload.deviceId = deviceId;
    }
    if (devices) {
        payload.devices = devices;
    }
    return payload;
}

interface Payload {
    type?: string,
    _id?: string,
    image?: string,
    name?: string,
    email?: string,
    firstSeen?: Date,
    lastSeen?: Date,
    active?: boolean,
    isOnline?: boolean,
    roles?: object,
    settings?: object,
    document?: any,
    deviceId?: string,
    devices?: any
}

const validatePerms = async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (req.user.type === "customer") {
        if (req.params.deviceid !== user.deviceId) {
            return res.redirect('/not-found')
        }
    }

    if (req.user.type === "operator") {
        if (!Object.values(user.devices).includes(req.params.deviceid)) {
            return res.redirect('/not-found')
        }
    }
    return next();
}

// const validatePerms = async (req, res, next) => {
//     const token = req.cookies.access_token;
//     if (!token) {
//         return res.clearCookie('token').redirect("/login");
//     }
//     const secret = Config.SECRET_TOKEN;
//     const user = jwt.verify(token, secret);

//     if (!user) {
//         return res.clearCookie('token').redirect("/login");
//     }

//     if (req.user.type === "customer") {
//         if (req.params.deviceid !== user.deviceId) {
//             return res.redirect('/not-found')
//         }
//     }

//     if (req.user.type === "operator") {
//         if (!Object.values(user.devices).includes(req.params.deviceid)) {
//             return res.redirect('/not-found')
//         }
//     }
//     return next();
// }



export {
    verifyPassword,
    generateHash,
    generateSalt,
    generateToken,
    isAllowed,
    isAllowedAdmin,
    generatePayload,
    onlyOperator,
    validatePerms,
    isValidJWT,
    generateMobileToken,
    verifyMobileToken,
}