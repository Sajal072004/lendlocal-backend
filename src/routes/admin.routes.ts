import { Router } from 'express';
import { protectAdmin } from '../middleware/protectAdmin.middleware';
import {
  loginAdmin,
  getAnalytics,
  getAllUsers,
  toggleUserDisabled,
  getAllReports,
  updateReportStatus,
} from '../controllers/admin.controller';

const router = Router();


router.post('/login', loginAdmin);


router.use(protectAdmin);

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.post('/users/:userId/toggle-disabled', toggleUserDisabled);
router.get('/reports', getAllReports);
router.post('/reports/:reportId/status', updateReportStatus);

export default router;