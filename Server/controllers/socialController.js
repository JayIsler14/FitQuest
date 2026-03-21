const db = require('../config/db');

exports.createPost = async (req, res) => {
  const { content } = req.body;

  await db.query(
    `INSERT INTO posts (user_id, content)
     VALUES ($1,$2)`,
    [req.user.id, content]
  );

  res.json({ message: "Post created" });
};

exports.getPosts = async (req, res) => {
  const result = await db.query(`
    SELECT p.*, u.email,
      COUNT(pl.post_id) AS like_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    GROUP BY p.id, u.email
    ORDER BY p.created_at DESC
  `);

  res.json(result.rows);
};

exports.likePost = async (req, res) => {
  await db.query(
    `INSERT INTO post_likes (user_id, post_id)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [req.user.id, req.params.id]
  );

  res.json({ message: "Post liked" });
};
