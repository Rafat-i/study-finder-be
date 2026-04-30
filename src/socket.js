const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    io.on("connection", (socket) => {
        socket.emit("socket:ready", {
            message: "WebSocket connection established."
        });

        socket.on("join:room", ({ userId }) => {
            if (userId) {
                socket.join(userId);
            }
        });
    });

    return io;
};

const emitRequestReceived = (ownerUserId, joinRequest) => {
    if (!io) return;
    io.to(ownerUserId).emit("request:received", {
        message: "Someone wants to join your study session!",
        data: { joinRequest }
    });
};

const emitRequestAccepted = (requesterUserId, joinRequest) => {
    if (!io) return;
    io.to(requesterUserId).emit("request:accepted", {
        message: "Your join request was accepted!",
        data: { joinRequest }
    });
};

const emitRequestDeclined = (requesterUserId, joinRequest) => {
    if (!io) return;
    io.to(requesterUserId).emit("request:declined", {
        message: "Your join request was declined.",
        data: { joinRequest }
    });
};

const emitRequestDeleted = (ownerUserId, joinRequestId) => {
    if (!io) return;
    io.to(ownerUserId).emit("request:deleted", {
        data: { joinRequestId }
    });
};

const emitSessionCreated = (session) => {
    if (!io) return;
    io.emit("session:created", {
        message: "A new study session was created!",
        data: { session }
    });
};

const emitSessionUpdated = (session) => {
    if (!io) return;
    io.emit("session:updated", {
        message: "A session was updated!",
        data: { session }
    });
};

const emitSessionDeleted = (sessionId) => {
    if (!io) return;
    io.emit("session:deleted", {
        data: { sessionId }
    });
};

module.exports = { initializeSocket, emitRequestReceived, emitRequestAccepted, emitRequestDeclined, emitRequestDeleted, emitSessionCreated, emitSessionUpdated, emitSessionDeleted };