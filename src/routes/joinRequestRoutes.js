const express = require("express");
const {
    createJoinRequest,
    getJoinRequests,
    getJoinRequestById,
    updateJoinRequest,
    deleteJoinRequest
} = require("../controllers/joinRequestController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createJoinRequest);
router.get("/", getJoinRequests);
router.get("/:id", getJoinRequestById);
router.patch("/:id", updateJoinRequest);
router.delete("/:id", deleteJoinRequest);

module.exports = router;
