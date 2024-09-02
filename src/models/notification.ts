import mongoose from "../config/database";

const Schema = mongoose.Schema;

const Notification = new Schema({
    deviceId: { type: String, required: true },
    appName: { type: String, required: true },
    content: { type: String, required: true }, // customer / operator/ admin
    postTime: { type: Date, required: true },
    key: { type: String, required: true },
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

Notification.index({ key: 1, postTime: 1 }, { unique: true });

export default mongoose.model("Notification", Notification);