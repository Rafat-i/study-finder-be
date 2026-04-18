const express = require("express");
const {
    createSession,
    getSessions,
    getSessionById,
    updateSession,
    deleteSession
} = require("../controllers/sessionController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createSession);
router.get("/", getSessions);
router.get("/:id", getSessionById);
router.patch("/:id", updateSession);
router.delete("/:id", deleteSession);

module.exports = router;
