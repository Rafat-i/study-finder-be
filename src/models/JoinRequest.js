const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending"
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudySession",
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);

module.exports = JoinRequest;
