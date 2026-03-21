const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createPost,
  getPosts,
  likePost
} = require('../controllers/socialController');

router.post('/', authenticate, createPost);
router.get('/', authenticate, getPosts);
router.post('/like/:id', authenticate, likePost);

module.exports = router;
