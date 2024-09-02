const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Wifi = new Schema({
    deviceId: { type: String, required: true },
    BSSID: { type: String },
    SSID: { type: String }, // customer / operator/ admin
    firstSeen: { type: Date },
    lastSeen: { type: Date },
    createdAt: { type: Date, default: new Date() },
},
    // { timestamps: true }
);

export default mongoose.model("Wifi", Wifi);