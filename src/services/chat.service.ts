import { Conversation, IConversation } from '../models/Conversation.model';
import { Message, IMessage } from '../models/Message.model';

export class ChatService {
  /**
   * Finds an existing conversation between two users or creates a new one.
   */
  public async findOrCreateConversation(userId1: string, userId2: string): Promise<IConversation> {
    // Find a conversation where both users are participants
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
    }).populate('participants', 'name profilePicture');

    // If no conversation exists, create one
    if (!conversation) {
      conversation = await Conversation.create({ participants: [userId1, userId2] });
      conversation = await conversation.populate('participants', 'name profilePicture');
    }

    return conversation;
  }
  
  /**
   * Gets all conversations for a specific user.
   */
  public async getUserConversations(userId: string): Promise<IConversation[]> {
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name profilePicture')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 });

    return conversations;
  }

  /**
   * Gets all messages for a specific conversation.
   */
  public async getMessages(conversationId: string, userId: string): Promise<IMessage[]> {
    // Verify user is part of the conversation before fetching messages
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
    if (!conversation) {
      throw new Error('You are not authorized to view these messages.');
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 'asc' });
      
    return messages;
  }

  /**
   * Creates a new message and updates the conversation.
   */
  public async sendMessage(
    senderId: string,
    conversationId: string,
    content?: string,
    imageUrl?: string
  ): Promise<IMessage> {
    if (!content && !imageUrl) {
      throw new Error('Message must have content or an image.');
    }

    const newMessage = await Message.create({
      sender: senderId,
      conversation: conversationId,
      content,
      imageUrl,
    });

    // Update the conversation's 'lastMessage' and 'updatedAt' fields
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

    return newMessage.populate('sender', 'name profilePicture');
  }
}