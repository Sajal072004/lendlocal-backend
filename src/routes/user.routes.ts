import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadProfilePhoto } from '../config/cloudinary';


import {
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  getBorrowingHistory,
  getLendingHistory,
  getUserLentItems,
  getAllUsers,
  updateNotificationPreferences,
  updateEmailNotificationPreferences
} from '../controllers/user.controller';


import {
  follow,
  unfollow,
  getFollowers,
  getFollowing
} from '../controllers/follow.controller';

const router = Router();


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


router.post('/:userId/follow', protect, follow);
router.delete('/:userId/unfollow', protect, unfollow);

router.put('/profile/notification-preferences', protect, updateNotificationPreferences);
router.put('/profile/email-notification-preferences', protect, updateEmailNotificationPreferences);



router.get('/:userId/profile', getUserProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/items', getUserLentItems);


export default router;