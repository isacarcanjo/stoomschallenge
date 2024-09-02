import mongoose from "../config/database";

const pointSchema = new mongoose.Schema({
    client_id: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    protocol_type: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    datetime_processed: {
        type: Number,
        required: true
    },
    datetime_received: {
        type: Number,
        required: true
    },
    geo: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        country_code: {
            type: String,
            required: true
        },
        postcode: {
            type: String,
            required: true
        },
        road: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        suburb: {
            type: String,
            required: true
        }
    },
    message_type: {
        type: String,
        required: true
    }
})

const Point = mongoose.model("Point", pointSchema)
export default Point