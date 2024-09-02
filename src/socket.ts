import { Server, Socket } from "socket.io";
import { Config } from "./config";
import geoip from 'geoip-lite';
import Manager from "./manager";
import { DeviceRepository } from "./repositories/implementations/DeviceRepository";
import { verifyMobileToken } from "./utils/auth";
import { DevicePayload } from "./entities/IDevice";

declare module 'socket.io' {
    interface Socket {
        device?: DevicePayload;
    }
}

export const socket = () => {
    const io = new Server(Config.SOCKET_PORT, {
        pingInterval: 30000,
    });

    io.use((socket, next) => {
        const token: string = socket.handshake.auth.token; // Ou socket.handshake.auth.token se estiver usando 'auth'
        if (!token) {
            return next(new Error('Token de autenticação não fornecido'));
        }
        const clientParams = socket.handshake.query;
        const realId: string = clientParams.id as string;
        verifyMobileToken(token, realId).then(decoded => {
            console.log('Token válido, payload:', decoded);
            socket.device = decoded as DevicePayload;
            next();
        }).catch((err: Error) => {
            console.error('Erro ao verificar o token:', err.message);
            return next(err);
        });
    });

    io.on('connection', async (socket) => {
        socket.emit('welcome');
        let clientParams = socket.handshake.query;
        let clientAddress = socket.request.socket;

        let clientIP = clientAddress.remoteAddress.substring(clientAddress.remoteAddress.lastIndexOf(':') + 1);
        let clientGeo: any = geoip.lookup(clientIP) || {};
        if (!clientGeo.country) socket.disconnect(true);
        const clientId = socket?.device?.clientId;
        const deviceId = socket?.device?._id;
        const realId: string = clientParams.id as string;
        new Manager(clientId, deviceId, realId).clientConnect(socket, {
            clientIP,
            clientGeo,
            device: {
                model: clientParams.model,
                manufacture: clientParams.manf,
                version: clientParams.release,
                secret: clientParams.secret,
            }
        });

        if (Config.DEBUG) {
            socket.use((packet, next) => {
                // packet[0] is the event name, packet[1] and beyond are arguments
                console.log('Event:', packet[0]);
                console.log('Data:', packet.slice(1));

                // Custom logic: add "*" event
                if (packet[0] !== '*') {
                    socket.emit('*', packet[0], ...packet.slice(1));
                }

                // Proceed with the original event
                next();
            });

            // Catch-all listener for "*"
            socket.on('*', (event, data) => {
                console.log('Wildcard event:', event);
                console.log('Wildcard data:', data);
            });
        }
    })
}
