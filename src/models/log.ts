import mongoose from "../config/database";
import ILog from "../entities/ILog";
const Schema = mongoose.Schema;

const LogModel = new Schema<ILog>({
    deviceId: { type: String, required: true },
    clientId: { type: String, required: true },
    createdAt: { type: Date, default: new Date() },
    type: { type: Object, required: true },
    message: { type: String, required: true },
},
    { timestamps: true }
);

export default mongoose.model("Log", LogModel);