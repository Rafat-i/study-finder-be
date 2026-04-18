const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        lastLocation: {
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

userSchema.index({ lastLocation: "2dsphere" }, { sparse: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
