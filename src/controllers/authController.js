const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required." });
        }

        const existingUser = await User.findOne({ email: String(email).toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        return res.status(201).json({
            message: "User registered successfully.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while registering the user." });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, latitude, longitude } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        if (latitude !== undefined && longitude !== undefined) {
            user.lastLocation = {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
            await user.save();
        }

        const token = generateToken(String(user._id), user.email);

        return res.json({
            message: "Login successful.",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    lastLocation: user.lastLocation,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while logging in." });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.json({
            message: "Authenticated user fetched successfully.",
            data: { user }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while fetching user." });
    }
};

module.exports = { register, login, getMe };
