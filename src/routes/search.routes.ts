import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { searchAll } from '../controllers/search.controller';

const router = Router();

// Protect the route to ensure only logged-in users can search
router.get('/', protect, searchAll);

export default router;