import mongoose from "../config/database";

const Schema = mongoose.Schema;

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
});

const GPS = new Schema({
    deviceId: { type: String, required: true },
    createdAt: { type: Date, default: new Date() },
    enabled: { type: Boolean, required: true },
    position: { type: pointSchema, required: true },
    altitude: { type: Number, required: true },
    address: { type: String },
    accuracy: { type: Number, required: true },
    speed: { type: Number, required: true },
    alert: {}
},
    { timestamps: true }
);

export default mongoose.model("GPS", GPS);