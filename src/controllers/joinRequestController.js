const JoinRequest = require("../models/JoinRequest");
const StudySession = require("../models/StudySession");
const { emitRequestReceived, emitRequestAccepted } = require("../socket");

const createJoinRequest = async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: "sessionId is required." });
        }

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Study session not found." });
        }

        if (String(session.createdBy) === req.user.id) {
            return res.status(400).json({ message: "You cannot join your own session." });
        }

        const existing = await JoinRequest.findOne({ sessionId, userId: req.user.id });
        if (existing) {
            return res.status(409).json({ message: "You already have a pending request for this session." });
        }

        const joinRequest = await JoinRequest.create({
            sessionId,
            userId: req.user.id,
            message: message || ""
        });

        const populated = await JoinRequest.findById(joinRequest._id)
            .populate("userId", "-password")
            .populate("sessionId");

        emitRequestReceived(String(session.createdBy), populated);

        return res.status(201).json({
            message: "Join request sent successfully.",
            data: { joinRequest: populated }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while creating join request." });
    }
};

const getJoinRequests = async (req, res) => {
    try {
        const sessions = await StudySession.find({ createdBy: req.user.id }).select("_id");
        const sessionIds = sessions.map((s) => s._id);

        const joinRequests = await JoinRequest.find({ sessionId: { $in: sessionIds } })
            .populate("userId", "-password")
            .populate("sessionId")
            .sort({ createdAt: -1 });

        return res.json({
            message: "Join requests fetched successfully.",
            data: { joinRequests }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while fetching join requests." });
    }
};

const getJoinRequestById = async (req, res) => {
    try {
        const joinRequest = await JoinRequest.findById(req.params.id)
            .populate("userId", "-password")
            .populate("sessionId");

        if (!joinRequest) {
            return res.status(404).json({ message: "Join request not found." });
        }

        return res.json({
            message: "Join request fetched successfully.",
            data: { joinRequest }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while fetching join request." });
    }
};

const updateJoinRequest = async (req, res) => {
    try {
        const joinRequest = await JoinRequest.findById(req.params.id).populate("sessionId");

        if (!joinRequest) {
            return res.status(404).json({ message: "Join request not found." });
        }

        if (String(joinRequest.sessionId.createdBy) !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this request." });
        }

        const { status } = req.body;

        if (!status || !["accepted", "declined"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'accepted' or 'declined'." });
        }

        joinRequest.status = status;
        await joinRequest.save();

        const populated = await JoinRequest.findById(joinRequest._id)
            .populate("userId", "-password")
            .populate("sessionId");

        if (status === "accepted") {
            emitRequestAccepted(String(populated.userId._id), populated);
        }

        return res.json({
            message: `Join request ${status}.`,
            data: { joinRequest: populated }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while updating join request." });
    }
};

const deleteJoinRequest = async (req, res) => {
    try {
        const joinRequest = await JoinRequest.findById(req.params.id);

        if (!joinRequest) {
            return res.status(404).json({ message: "Join request not found." });
        }

        if (String(joinRequest.userId) !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this request." });
        }

        await joinRequest.deleteOne();

        return res.json({ message: "Join request deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while deleting join request." });
    }
};

module.exports = {
    createJoinRequest,
    getJoinRequests,
    getJoinRequestById,
    updateJoinRequest,
    deleteJoinRequest
};
