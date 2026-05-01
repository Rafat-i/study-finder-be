const JoinRequest = require("../models/JoinRequest");
const StudySession = require("../models/StudySession");
const { emitRequestReceived, emitRequestAccepted, emitRequestDeclined, emitSessionUpdated, emitRequestDeleted } = require("../socket");

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

        if (session.spotsAvailable <= 0) {
            return res.status(400).json({ message: "This session is full." });
        }

        const existing = await JoinRequest.findOne({ sessionId, userId: req.user.id });
        if (existing) {
            const messages = {
                pending: "You already have a pending request for this session.",
                accepted: "You have already been accepted into this session.",
                declined: "Your previous request was declined. You cannot request again."
            };
            return res.status(409).json({ message: messages[existing.status] });
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

const getSentRequests = async (req, res) => {
    try {
        const joinRequests = await JoinRequest.find({ userId: req.user.id })
            .populate("sessionId")
            .populate("userId", "-password")
            .sort({ createdAt: -1 });

        return res.json({
            message: "Sent requests fetched successfully.",
            data: { joinRequests }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while fetching sent requests." });
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

        if (status === "accepted") {
            const session = await StudySession.findById(joinRequest.sessionId._id);
            if (session.spotsAvailable <= 0) {
                joinRequest.status = "pending";
                await joinRequest.save();
                return res.status(400).json({ message: "Cannot accept: this session is already full." });
            }

            const updatedSession = await StudySession.findByIdAndUpdate(
                joinRequest.sessionId._id,
                { $inc: { spotsAvailable: -1 } },
                { new: true }
            ).populate("createdBy", "-password");

            emitSessionUpdated(updatedSession);
        }

        const populated = await JoinRequest.findById(joinRequest._id)
            .populate("userId", "-password")
            .populate("sessionId");

        if (status === "accepted") {
            emitRequestAccepted(String(populated.userId._id), populated);
        } else if (status === "declined") {
            emitRequestDeclined(String(populated.userId._id), populated);
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
        const joinRequest = await JoinRequest.findById(req.params.id).populate("sessionId");

        if (!joinRequest) {
            return res.status(404).json({ message: "Join request not found." });
        }

        const isRequester = String(joinRequest.userId) === req.user.id;
        const isSessionOwner = String(joinRequest.sessionId.createdBy) === req.user.id;

        if (!isRequester && !isSessionOwner) {
            return res.status(403).json({ message: "Not authorized to delete this request." });
        }

        let updatedSession = null;

        if (joinRequest.status === "accepted") {
            updatedSession = await StudySession.findByIdAndUpdate(
                joinRequest.sessionId._id,
                { $inc: { spotsAvailable: 1 } },
                { new: true }
            ).populate("createdBy", "-password");
        }

        const ownerUserId = String(joinRequest.sessionId.createdBy);
        const requesterUserId = String(joinRequest.userId);
        const joinRequestId = String(joinRequest._id);

        await joinRequest.deleteOne();

        if (updatedSession) {
            emitSessionUpdated(updatedSession);
        }

        emitRequestDeleted(ownerUserId, requesterUserId, joinRequestId);

        return res.json({ message: "Join request deleted successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while deleting join request." });
    }
};

module.exports = {
    createJoinRequest,
    getJoinRequests,
    getSentRequests,
    getJoinRequestById,
    updateJoinRequest,
    deleteJoinRequest
};