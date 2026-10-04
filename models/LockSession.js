const mongoose = require("mongoose");

const lockSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        lockedAt: {
            type: Date,
            required: true,
            index: true
        },

        unlockedAt: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("LockSession", lockSessionSchema);