import { ItemRequest, IItemRequest } from '../models/ItemRequest.model';
import { Community } from '../models/Community.model';
import { NotificationService } from './notification.service';
const notificationService = new NotificationService();

export class ItemRequestService {
  /**
   * Creates a new item request and notifies all community members.
   */
  public async create(requestData: Partial<IItemRequest>, userId: string): Promise<IItemRequest> {
    const community = await Community.findById(requestData.community);
    if (!community) {
      throw new Error('Community not found.');
    }

    const itemRequest = await ItemRequest.create({
      ...requestData,
      requestedBy: userId,
    });

    
    const membersToNotify = community.members.filter(memberId => memberId.toString() !== userId);
    
    for (const memberId of membersToNotify) {
      await notificationService.createNotification({
        recipient: memberId.toString(),
        sender: userId,
        type: 'new_item_request', 
        message: `is looking for a "${itemRequest.itemName}" in your community.`,
        link: `/community/${requestData.community}`
      });
    }

    return itemRequest;
  }

  /**
   * Finds all active item requests for a specific community.
   */
  public async findByCommunity(communityId: string): Promise<IItemRequest[]> {
    return ItemRequest.find({ community: communityId, status: 'active' })
      .populate('requestedBy', 'name profilePicture')
      .sort({ createdAt: -1 });
  }
}