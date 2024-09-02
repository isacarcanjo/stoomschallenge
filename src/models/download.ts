import mongoose from "../config/database";

const Schema = mongoose.Schema;

const Download = new Schema({
    deviceId: { type: String, required: true },
    type: { type: String, required: true }, // voiceRecord, download
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    ext: { type: String, required: true },
    duration: { type: String, required: false },
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

export default mongoose.model("Download", Download);