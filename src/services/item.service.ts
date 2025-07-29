import { Item, IItem } from '../models/Item.model';
import { Community } from '../models/Community.model';

interface ICreateItemData {
  name: string;
  description: string;
  category: string;
  communityId: string;
  ownerId: string;
  photos?: string[];
}

interface IUpdateItemData {
  name?: string;
  description?: string;
  category?: string;
  photos?: string[];
}

export class ItemService {
  /**
   * Creates a new item listing.
   */
  public async create(data: ICreateItemData): Promise<IItem> {
    const { name, description, category, photos, ownerId, communityId } = data;
  
    // Verify the user is a member of the community.
    const community = await Community.findOne({ _id: communityId, members: ownerId });
    if (!community) {
      throw new Error('You must be a member of this community to add an item.');
    }
  
    // Create the new item with the correct field names for the model
    const item = await Item.create({
      name,
      description,
      category,
      photos: photos || [],
      owner: ownerId, // <-- THE FIX: Map ownerId to the 'owner' field
      community: communityId,
    });
  
    return item;
  }

  /**
   * Finds all items within a specific community.
   */
  public async findByCommunity(communityId: string, userId: string): Promise<IItem[]> {
    // Verify the user is a member of the community to see its items.
    const community = await Community.findOne({ _id: communityId, members: userId });
    if (!community) {
      throw new Error('You must be a member of this community to view its items.');
    }

    return Item.find({ community: communityId }).populate('owner', 'name profilePicture');
  }
  
  /**
   * Updates an item's details.
   */
  public async update(itemId: string, userId: string, updateData: IUpdateItemData): Promise<IItem | null> {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found.');
    }
    
    // Ensure the user trying to update the item is its owner.
    if (item.owner.toString() !== userId.toString()) {
      throw new Error('You are not authorized to update this item.');
    }
    
    return Item.findByIdAndUpdate(itemId, updateData, { new: true });
  }
  
  /**
   * Deletes an item.
   */
  public async delete(itemId: string, userId: string): Promise<void> {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error('Item not found.');
    }

    // Ensure the user trying to delete the item is its owner.
    if (item.owner.toString() !== userId) {
      throw new Error('You are not authorized to delete this item.');
    }

    await Item.findByIdAndDelete(itemId);
  }
}