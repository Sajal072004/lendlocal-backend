import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadProfilePhoto } from '../config/cloudinary';

// Import all user controllers
import {
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  getBorrowingHistory,
  getLendingHistory,
  getUserLentItems,
  getAllUsers
} from '../controllers/user.controller';

// Import all follow controllers
import {
  follow,
  unfollow,
  getFollowers,
  getFollowing
} from '../controllers/follow.controller';

const router = Router();

// --- My Profile & History (requires login) ---
router.get('/profile/me', protect, getMyProfile);
router.put(
  '/profile',
  protect,
  uploadProfilePhoto.single('profilePicture'),
  updateUserProfile
);
router.get('/history/borrowed', protect, getBorrowingHistory);
router.get('/history/lent', protect, getLendingHistory);

router.get('/all', protect, getAllUsers);

// --- Follow / Unfollow (requires login) ---
router.post('/:userId/follow', protect, follow);
router.delete('/:userId/unfollow', protect, unfollow);


// --- Public Routes (do not require login) ---
router.get('/:userId/profile', getUserProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/items', getUserLentItems);


export default router;