const mongoose = require("mongoose");

const lockSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: "main-lock"
        },

        locked: {
            type: Boolean,
            default: false
        },

        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        lockedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Lock", lockSchema);