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

module.exports = { initializeSocket, emitRequestReceived, emitRequestAccepted };
