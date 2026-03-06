const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await db.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );

    if (existing.rows.length)
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id',
      [email, hash]
    );

    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });

  } catch {
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );

    if (!result.rows.length)
      return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });

  } catch {
    res.status(500).json({ message: "Login failed" });
  }
};
