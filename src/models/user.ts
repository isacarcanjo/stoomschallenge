import mongoose from "../config/database";
import IUser from "../entities/IUser";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const User = new Schema<IUser>({
    deviceId: { type: String, required: false, },
    type: { type: String, required: true, default: "customer" }, // customer / operator/ admin
    owner: { type: String }, // case, wil be customer
    name: { type: String, required: true },
    email: { type: String, required: true },
    document: { type: String, required: true },
    birthDate: { type: String },
    password: { type: String, required: true },
    firstSeen: { type: Date },
    lastSeen: { type: Date },
    createdBy: { type: ObjectId },
    image: { type: String },
    active: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    devices: [String],
    roles: [],
    settings: {
        type: Object, default: {
            enabledPermissions: [],
            notify: true,
        }
    },
    enabledPermissions: [], // String list
    apps: [{
        appName: { type: String },
        packageName: { type: String },
        versionName: { type: String },
        versionCode: { type: Number },
    }],
    clipboardLog: [{
        time: { type: Date },
        content: { type: String },
    }],
    currentFolder: [{
        name: { type: String },
        isDir: { type: Boolean },
        path: { type: String },
    }]
},
    { timestamps: true }
);

export default mongoose.model("User", User);

