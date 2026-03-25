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

exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.json([]);
    }

    const result = await db.query(
      `
      SELECT 
        u.id,
        u.username,
        up.goal,
        COALESCE(up.is_public, false) AS is_public,
        COALESCE(us.streak, 0) AS streak,
        COALESCE(p.points, 0) AS points
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN user_streaks us ON us.user_id = u.id
      LEFT JOIN user_points p ON p.user_id = u.id
      WHERE COALESCE(up.is_public, false) = true
        AND (
          u.username ILIKE $1
          OR COALESCE(up.goal, '') ILIKE $1
        )
      LIMIT 20
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('searchUsers error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

exports.getUserPosts = async (req, res) => {

  try {

    const userId = req.params.id;

    const posts = await db.query(
      `SELECT 
        p.id,
        p.content,
        p.created_at,
        COUNT(pl.post_id) AS likes
       FROM posts p
       LEFT JOIN post_likes pl ON pl.post_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(posts.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to fetch user posts" });

  }

};

exports.getUserProgress = async (req,res)=>{

  const userId = req.params.id;

  const result = await db.query(`
    SELECT 
      u.username,
      COALESCE(us.streak,0) as streak,
      COALESCE(p.points,0) as points
    FROM users u
    LEFT JOIN user_streaks us ON us.user_id = u.id
    LEFT JOIN user_points p ON p.user_id = u.id
    WHERE u.id = $1
  `,[userId]);

  res.json(result.rows[0]);

};
