import mongoose from "../config/database";

const Schema = mongoose.Schema;

const SMS = new Schema({
    deviceId: { type: String, required: true },
    body: { type: String, required: true }, // customer / operator/ admin
    type: { type: String, required: true },
    read: { type: String, required: true },
    date: { type: Date, required: true },
    address: String,
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

SMS.index({ address: 1, date: 1 }, { unique: true });

export default mongoose.model("SMS", SMS);