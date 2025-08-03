import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { confirmReturn, getRequestById, getRequests, initiateReturn, requestItem, respondToRequest, returnItem } from '../controllers/borrow.controller';

const router = Router();

// Protect all routes in this file
router.use(protect);

router.post('/request/:itemId', requestItem);
router.post('/respond/:requestId', respondToRequest);
router.get('/requests', getRequests);
router.get('/requests/:id', getRequestById);
router.post('/return/:requestId', returnItem);

router.post('/requests/:id/return', initiateReturn);
router.post('/requests/:id/confirm-return', confirmReturn);

export default router;