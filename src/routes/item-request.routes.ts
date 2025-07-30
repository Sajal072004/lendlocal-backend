import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  acceptOffer,
  createItemRequest,
  getOpenRequestsForCommunity,
  makeOfferOnRequest,
} from '../controllers/item-request.controller';

const router = Router();

// Protect all routes in this file, as a user must be logged in.
router.use(protect);

// Route to create a new "in-search-of" request
router.post('/', createItemRequest);

// Route to get all open requests for a community
router.get('/community/:communityId', getOpenRequestsForCommunity);

// Route for a user to make an offer on a request
router.post('/:requestId/offers', makeOfferOnRequest);
router.post('/:requestId/offers/:offerId/accept', acceptOffer); 

export default router;