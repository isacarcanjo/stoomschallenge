import mongoose from "../config/database";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Operator = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    document: { type: String, required: true },
    // birthDate: { type: String, required: true },
    password: { type: String, required: true },
    firstSeen: { type: Date, default: new Date() },
    lastSeen: { type: Date },
    // createdBy: { type: ObjectId, required: true },
    active: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    roles: {
        type: Object, default: {
            notify: true,
        }
    },
    settings: {
        type: Object, default: {
            enabledPermissions: [],
            gpsSettings: {
                updateFrequency: 300 //millisecond
            },
        }
    },
    customers: [{
        name: { type: String },
        email: { type: String },
        password: { type: String },
        firstSeen: { type: Date },
        lastSeen: { type: Date },
        image: String,
        active: { type: Boolean, default: true },
        isOnline: { type: Boolean, default: false },
        roles: {
            type: Object, default: {
                notify: true,
            }
        },
        settings: {
            type: Object, default: {
                enabledPermissions: [],
                gpsSettings: {
                    updateFrequency: 300 //millisecond
                },
            }
        },
    }]
},
    { timestamps: true }
);

export default mongoose.model("Operator", Operator);