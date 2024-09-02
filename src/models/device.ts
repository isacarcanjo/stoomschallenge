import mongoose from "../config/database";
import IDevice from "../entities/IDevice";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const defaultExpiresDate = () => {
    const date = new Date();
    date.setMonth(new Date().getMonth() + 1);
    return date
}

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    },
    radius: {
        type: Number
    }
});

const Device = new Schema<IDevice>({
    clientId: { type: String },
    name: { type: String },
    model: { type: String },
    manufacture: { type: String },
    version: { type: String },
    firstSeen: { type: Date },
    lastSeen: { type: Date },
    active: { type: Boolean, default: true },
    disabledAt: { type: Date }, 
    deletedAt: { type: Date }, 
    isOnline: { type: Boolean, default: false },
    realId: { type: String },
    alerts: [], // Cada vez que o app conectar no websocket ele buscar as regras do device e alimenta no array de devices.
    license: {
        code: { type: String, required: true },
        createdAt: { type: Date, default: new Date() },
        activated: { type: Boolean, default: false },
        expiresIn: { type: Date },
    },
    commands: Array<Object>,
    gpsSettings: {
        updateFrequency: { type: Number, default: 300000 }, //seconds 5min
    },
    areasEnable: { type: Boolean, default: false },
    areas: [Object],
    dynamicData: {
        clientIP: { type: String },
        clientGeo: {
            range: [Number],
            country: { type: String, default: "" },
            region: { type: String },
            eu: { type: String },
            timezone: { type: String },
            city: { type: String },
            ll: [Number],
            metro: { type: Number },
            area: { type: Number },
        },
    },
    wifi: [{
        BSSID: { type: String },
        SSID: { type: String },
        firstSeen: { type: Date },
        lastSeen: { type: Date },
        createdAt: { type: Date },
    }],
    currentFolder: Array<Object>
},
    { timestamps: true }
);

export default mongoose.model("Device", Device);