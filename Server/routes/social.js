const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createPost,
  getPosts,
  likePost,
  getUserProgress,
  getUserPosts,
  searchUsers,
  followUser,
  unfollowUser,
  getMyFollowers,
  getMyFollowing,
  getFollowStatus
} = require('../controllers/socialController');

router.get('/search', searchUsers);
router.get('/user/:id', getUserPosts);
router.get('/progress/:id', getUserProgress);

router.post('/', authenticate, createPost);
router.get('/', authenticate, getPosts);
router.post('/like/:id', authenticate, likePost);

router.post('/follow/:id', authenticate, followUser);
router.delete('/follow/:id', authenticate, unfollowUser);
router.get('/follow-status/:id', authenticate, getFollowStatus);

router.get('/followers', authenticate, getMyFollowers);
router.get('/following', authenticate, getMyFollowing);

module.exports = router;