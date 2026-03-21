const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createPost,
  getPosts,
  likePost,
  getUserProgress,
  getUserPosts
} = require('../controllers/socialController');

const { searchUsers } = require('../controllers/socialController');

router.get('/search', authenticate, searchUsers);

router.get('/user/:id', authenticate, getUserPosts);

router.post('/', authenticate, createPost);
router.get('/', authenticate, getPosts);
router.post('/like/:id', authenticate, likePost);

router.get('/progress/:id', authenticate, getUserProgress);

module.exports = router;
