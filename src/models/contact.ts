import mongoose from "../config/database";

const Schema = mongoose.Schema;

const Contact = new Schema({
    deviceId: { type: String, required: true },
    phoneNo: { type: String, required: true },
    name: { type: String, required: true }, // customer / operator/ admin
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

// TODO? usar para melhorar a performace
// Contact.index({ phoneNo: 1, name: 1 }, { unique: true });

export default mongoose.model("Contact", Contact);