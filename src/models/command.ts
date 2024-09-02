import mongoose from "../config/database";

const Schema = mongoose.Schema;

const Command = new Schema({
    deviceId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

export default mongoose.model("Command", Command);