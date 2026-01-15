const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);

// NEW: Check current logged-in user
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Current user ✅",
    user: req.user,
  });
});

module.exports = router;
