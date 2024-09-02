import mongoose from "../config/database";

const Schema = mongoose.Schema;

const Plan = new Schema({
    name: { type: String },
    price: { type: Number },
    active: { type: Boolean, default: true },
},
    { timestamps: true }
);

export default mongoose.model("Plan", Plan);