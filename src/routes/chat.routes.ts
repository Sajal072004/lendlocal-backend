import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadChatImage } from '../config/cloudinary';
import {
    getConversations,
    createConversation,
    getMessages,
    sendMessage
} from '../controllers/chat.controller';

const router = Router();
router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post(
    '/conversations/:conversationId/messages', 
    uploadChatImage.single('image'), 
    sendMessage
);

export default router;