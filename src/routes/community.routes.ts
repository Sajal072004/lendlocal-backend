import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createCommunity,
  joinCommunity,
  getUserCommunities,
  getCommunityById,
  getCommunityInviteCode,
  getAllCommunities,
} from '../controllers/community.controller';

const router = Router();

router.get('/all', protect, getAllCommunities);

// Apply the 'protect' middleware to all routes in this file
router.use(protect);


router.post('/join', joinCommunity);
router.post('/', createCommunity);
router.get('/', getUserCommunities);
router.get('/:id', getCommunityById);
router.get('/:id/invite-code', getCommunityInviteCode);

export default router;