const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendResetEmail } = require("../services/emailService");
const db = require("../db"); // ADD THIS
const jwt = require("jsonwebtoken");

const {
  register,
  login,
  refreshToken,
  logout,
  getMe
} = require("../controllers/authController");

const authenticate = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

router.post("/refresh", refreshToken);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await db.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (user.rows.length === 0) {
    return res.json({ message: "If email exists, reset link sent." });
  }

  const crypto = require("crypto");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await db.query(
    `UPDATE users
     SET reset_token=$1, reset_token_expiry=$2
     WHERE email=$3`,
    [resetToken, expiry, email]
  );

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const { sendResetEmail } = require("../services/emailService");

  await sendResetEmail(email, resetLink);

  res.json({ message: "Reset email sent" });
});

router.post("/reset-password/:token", async (req, res) => {

  const { token } = req.params;
  const { password } = req.body;

  console.log("TOKEN RECEIVED:", token);

  const user = await db.query(
    `SELECT * FROM users WHERE reset_token=$1`,
    [token]
  );

  if (user.rows.length === 0) {
    return res.status(400).json({ message: "Invalid token" });
  }

  const expiry = new Date(user.rows[0].reset_token_expiry);

  if (expiry < new Date()) {
    return res.status(400).json({ message: "Token expired" });
  }

  console.log("USER FOUND:", user.rows);

  if (user.rows.length === 0) {
    return res.status(400).json({
      message: "Invalid or expired token"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    `UPDATE users
     SET password_hash=$1,
         reset_token=NULL,
         reset_token_expiry=NULL
     WHERE id=$2`,
    [hashedPassword, user.rows[0].id]
  );

  res.json({ message: "Password reset successful" });

});
module.exports = router;