const db = require('../config/db');

exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const result = await db.query(
      `
      INSERT INTO posts (user_id, content)
      VALUES ($1, $2)
      RETURNING id, user_id, content, created_at
      `,
      [req.user.id, content.trim()]
    );

    res.status(201).json({
      ...result.rows[0],
      likes: 0,
      viewer_has_liked: false
    });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.content,
        p.created_at,
        u.email,
        u.username,
        COUNT(pl.post_id)::int AS likes,
        EXISTS (
          SELECT 1
          FROM post_likes viewer_like
          WHERE viewer_like.post_id = p.id
            AND viewer_like.user_id = $1
        ) AS viewer_has_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN post_likes pl ON pl.post_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id, p.user_id, p.content, p.created_at, u.email, u.username
      ORDER BY p.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getPosts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user.id;

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const postExists = await db.query(
      `SELECT id FROM posts WHERE id = $1`,
      [postId]
    );

    if (postExists.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await db.query(
      `
      INSERT INTO post_likes (user_id, post_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, post_id) DO NOTHING
      `,
      [userId, postId]
    );

    const likesResult = await db.query(
      `
      SELECT COUNT(*)::int AS likes
      FROM post_likes
      WHERE post_id = $1
      `,
      [postId]
    );

    res.json({
      message: 'Post liked',
      postId,
      likes: likesResult.rows[0].likes,
      viewer_has_liked: true
    });
  } catch (err) {
    console.error('likePost error:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
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
    const profileUserId = Number(req.params.id);
    const viewerUserId = req.user?.id ?? null;

    if (!Number.isInteger(profileUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const posts = await db.query(
      `
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.created_at,
        u.username,
        COUNT(pl.post_id)::int AS likes,
        CASE
          WHEN $2::int IS NULL THEN false
          ELSE EXISTS (
            SELECT 1
            FROM post_likes viewer_like
            WHERE viewer_like.post_id = p.id
              AND viewer_like.user_id = $2
          )
        END AS viewer_has_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN post_likes pl ON pl.post_id = p.id
      WHERE p.user_id = $1
      GROUP BY p.id, p.user_id, p.content, p.created_at, u.username
      ORDER BY p.created_at DESC
      `,
      [profileUserId, viewerUserId]
    );

    res.json(posts.rows);
  } catch (err) {
    console.error('getUserPosts error:', err);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
};

exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await db.query(
      `
      SELECT 
        u.id,
        u.username,
        COALESCE(us.streak, 0) AS streak,
        COALESCE(p.points, 0) AS points
      FROM users u
      LEFT JOIN user_streaks us ON us.user_id = u.id
      LEFT JOIN user_points p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const counts = await db.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1) AS followers_count,
        (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1) AS following_count
      `,
      [userId]
    );

    res.json({
      ...result.rows[0],
      followersCount: counts.rows[0].followers_count,
      followingCount: counts.rows[0].following_count
    });
  } catch (err) {
    console.error('getUserProgress error:', err);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
};

exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = Number(req.params.id);

    if (!Number.isInteger(followingId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const userExists = await db.query(
      `SELECT id FROM users WHERE id = $1`,
      [followingId]
    );

    if (!userExists.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.query(
      `
      INSERT INTO user_follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT (follower_id, following_id) DO NOTHING
      `,
      [followerId, followingId]
    );

    const counts = await db.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1) AS followers_count,
        (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1) AS following_count
      `,
      [followingId]
    );

    res.json({
      message: 'User followed',
      isFollowing: true,
      followersCount: counts.rows[0].followers_count,
      followingCount: counts.rows[0].following_count
    });
  } catch (err) {
    console.error('followUser error:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = Number(req.params.id);

    if (!Number.isInteger(followingId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    await db.query(
      `
      DELETE FROM user_follows
      WHERE follower_id = $1 AND following_id = $2
      `,
      [followerId, followingId]
    );

    const counts = await db.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1) AS followers_count,
        (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1) AS following_count
      `,
      [followingId]
    );

    res.json({
      message: 'User unfollowed',
      isFollowing: false,
      followersCount: counts.rows[0].followers_count,
      followingCount: counts.rows[0].following_count
    });
  } catch (err) {
    console.error('unfollowUser error:', err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

exports.getMyFollowers = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT
        u.id,
        u.username,
        COALESCE(up.goal, '') AS goal
      FROM user_follows uf
      JOIN users u ON u.id = uf.follower_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE uf.following_id = $1
      ORDER BY u.username ASC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getMyFollowers error:', err);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

exports.getMyFollowing = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `
      SELECT
        u.id,
        u.username,
        COALESCE(up.goal, '') AS goal
      FROM user_follows uf
      JOIN users u ON u.id = uf.following_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE uf.follower_id = $1
      ORDER BY u.username ASC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getMyFollowing error:', err);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = Number(req.params.id);

    if (!Number.isInteger(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM user_follows
        WHERE follower_id = $1 AND following_id = $2
      ) AS is_following
      `,
      [currentUserId, targetUserId]
    );

    res.json({
      isFollowing: result.rows[0].is_following
    });
  } catch (err) {
    console.error('getFollowStatus error:', err);
    res.status(500).json({ error: 'Failed to fetch follow status' });
  }
};