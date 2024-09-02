import mongoose from "../config/database";

const Schema = mongoose.Schema;

const Call = new Schema({
    deviceId: { type: String, required: true },
    phoneNo: { type: String, required: true },
    name: String,
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: Number, required: true },
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

Call.index({ phoneNo: 1, date: 1 }, { unique: true });

export default mongoose.model("Call", Call);