import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getNotifications, markNotificationAsRead } from '../controllers/notification.controller';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/:notificationId/read', markNotificationAsRead);

export default router;