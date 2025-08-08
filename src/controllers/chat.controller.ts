import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { io } from '../socket';

const chatService = new ChatService();

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const conversations = await chatService.getUserConversations(userId);
    res.status(200).json(conversations);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const createConversation = async (req: Request, res: Response) => {
    try {
        const userId1 = req.user!._id.toString();
        const { userId2 } = req.body; 
        const conversation = await chatService.findOrCreateConversation(userId1, userId2);
        res.status(201).json(conversation);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user!._id.toString();
        const messages = await chatService.getMessages(conversationId, userId);
        res.status(200).json(messages);
    } catch (error) {
        res.status(403).json({ message: (error as Error).message });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const senderId = req.user!._id.toString();
        const { content } = req.body;
        const imageUrl = req.file?.path;

        const newMessage = await chatService.sendMessage(senderId, conversationId, content, imageUrl);
        
        
        
        
        io.to(conversationId).emit('receiveMessage', newMessage);
        
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};