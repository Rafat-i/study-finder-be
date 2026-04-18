const StudySession = require("../models/StudySession");

const createSession = async (req, res) => {
    try {
        const { title, subject, date, location, spotsAvailable, latitude, longitude } = req.body;

        if (!title || !subject || !date || !location || !spotsAvailable) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const sessionData = {
            title,
            subject,
            date,
            location,
            spotsAvailable,
            createdBy: req.user.id
        };

        if (latitude !== undefined && longitude !== undefined) {
            sessionData.coordinates = {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        const session = await StudySession.create(sessionData);
        const populated = await session.populate("createdBy", "-password");

        return res.status(201).json({
            message: "Study session created successfully.",
            data: { session: populated }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while creating session." });
    }
};

const getSessions = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        let query = {};

        if (lat && lng && radius) {
            const radiusInMeters = parseFloat(radius) * 1000;

            query = {
                coordinates: {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: radiusInMeters
                    }
                }
            };
        }

        const sessions = await StudySession.find(query)
            .populate("createdBy", "-password")
            .sort({ date: 1 });

        return res.json({
            message: "Sessions fetched successfully.",
            data: { sessions }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while fetching sessions." });
    }
};

const getSessionById = async (req, res) => {
    try {
        const session = await StudySession.findById(req.params.id).populate("createdBy", "-password");

        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        return res.json({
            message: "Session fetched successfully.",
            data: { session }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while fetching session." });
    }
};

const updateSession = async (req, res) => {
    try {
        const session = await StudySession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        if (String(session.createdBy) !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this session." });
        }

        const { title, subject, date, location, spotsAvailable } = req.body;

        if (title !== undefined) session.title = title;
        if (subject !== undefined) session.subject = subject;
        if (date !== undefined) session.date = date;
        if (location !== undefined) session.location = location;
        if (spotsAvailable !== undefined) session.spotsAvailable = spotsAvailable;

        await session.save();
        const populated = await session.populate("createdBy", "-password");

        return res.json({
            message: "Session updated successfully.",
            data: { session: populated }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while updating session." });
    }
};

const deleteSession = async (req, res) => {
    try {
        const session = await StudySession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: "Session not found." });
        }

        if (String(session.createdBy) !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this session." });
        }

        await session.deleteOne();

        return res.json({ message: "Session deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while deleting session." });
    }
};

module.exports = { createSession, getSessions, getSessionById, updateSession, deleteSession };
