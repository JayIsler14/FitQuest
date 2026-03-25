const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


// ============================================
// REGISTER
// ============================================
exports.register = async (req, res) => {

  try {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await db.query(
      `SELECT id
       FROM users
       WHERE email=$1 OR username=$2`,
      [email, username]
    );

    if (existing.rows.length) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, username, email`,
      [username, email, hash]
    );

    const user = result.rows[0];

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        hasCompletedOnboarding: false
      }
    });

  } catch (err) {

    console.error("Registration Error:", err);
    res.status(500).json({ message: "Registration failed" });

  }

};



// ============================================
// LOGIN
// ============================================
exports.login = async (req, res) => {

  try {

    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const result = await db.query(
      `SELECT id, username, email, password_hash
       FROM users
       WHERE email=$1 OR username=$1`,
      [identifier]
    );

    if (!result.rows.length) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        hasCompletedOnboarding: true
      }
    });

  } catch (err) {

    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed" });

  }

};



// ============================================
// REFRESH TOKEN
// ============================================
exports.refreshToken = (req, res) => {

  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {

    if (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });

  });

};



// ============================================
// LOGOUT
// ============================================
exports.logout = (req, res) => {

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  res.json({ message: "Logged out successfully" });

};



// ============================================
// GET CURRENT USER
// ============================================
exports.getMe = async (req, res) => {

  try {

    const result = await db.query(
      `SELECT id, username, email
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error("getMe Error:", err);
    res.status(500).json({ message: "Server error" });

  }

};