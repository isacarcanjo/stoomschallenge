import ILog from "../../entities/ILog";
import Log from "../../models/log";
import ILoggerRepository from "../ILoggerRepository";

const logTypes: Object = {
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


export class LoggerRepository implements ILoggerRepository<ILog> {
    public async log(ipt: ILog): Promise<void> {
        await Log.create(ipt);
    }

    async queryAll(clientId: String): Promise<ILog[]> {
        const logs = await Log.find({ clientId: clientId }).sort({ createdAt: -1 });
        return logs;
    }
}

export default logTypes;