import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createCommunity,
  joinCommunity,
  getUserCommunities,
  getCommunityById,
  getCommunityInviteCode,
  getAllCommunities,
  getCommunityJoinRequests,
  requestToJoinCommunity,
  respondToCommunityJoinRequest,
} from '../controllers/community.controller';

const router = Router();

router.get('/all', protect, getAllCommunities);


router.post('/:id/request-join', protect, requestToJoinCommunity);
router.get('/:id/join-requests', protect, getCommunityJoinRequests);
router.post('/join-requests/:requestId/respond', protect, respondToCommunityJoinRequest);


router.post('/join', protect, joinCommunity);
router.post('/', protect, createCommunity);
router.get('/',protect, getUserCommunities);
router.get('/:id', protect, getCommunityById);
router.get('/:id/invite-code',protect, getCommunityInviteCode);

export default router;