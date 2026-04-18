const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const joinRequestRoutes = require("./routes/joinRequestRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/sessions", sessionRoutes);
app.use("/join-requests", joinRequestRoutes);

module.exports = app;
