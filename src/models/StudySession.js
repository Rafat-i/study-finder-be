const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            required: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        spotsAvailable: {
            type: Number,
            required: true,
            min: 1
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        coordinates: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number],
                default: undefined
            }
        }
    },
    {
        timestamps: true
    }
);

studySessionSchema.index({ coordinates: "2dsphere" }, { sparse: true });

const StudySession = mongoose.model("StudySession", studySessionSchema);

module.exports = StudySession;
