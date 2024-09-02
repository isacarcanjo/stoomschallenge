import mongoose from "../config/database";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Customer = new Schema({
    operatorId: { type: ObjectId, require: true },
    operatorName: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    loginToken: { type: String, default: null},
    password: { type: String, required: true },
    createdBy: String,
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
    active: { type: Boolean, default: true },
},
    { timestamps: true }
);

export default mongoose.model("Customer", Customer);