import { Item, IItem } from '../models/Item.model';
import { Community } from '../models/Community.model';
import { User } from '../models/User.model';
import { BorrowRequest } from '../models/BorrowRequest.model';

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
  
    
    const community = await Community.findOne({ _id: communityId, members: ownerId });
    if (!community) {
      throw new Error('You must be a member of this community to add an item.');
    }
  
    
    const item = await Item.create({
      name,
      description,
      category,
      photos: photos || [],
      owner: ownerId, 
      community: communityId,
    });
  
    return item;
  }

  /**
   * Finds all items within a specific community.
   */
  public async findByCommunity(communityId: string, userId: string): Promise<IItem[]> {
    
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
    
    
    if (item.owner.toString() !== userId.toString()) {
      throw new Error('You are not authorized to update this item.');
    }
    
    return Item.findByIdAndUpdate(itemId, updateData, { new: true });
  }
  
  

  

  /**
   * Searches for items across all communities based on a text query and the user's location.
   * Calculates the distance from the searching user to the item's owner.
   * @param query - The text to search for in item names and descriptions.
   * @param longitude - The longitude of the searching user.
   * @param latitude - The latitude of the searching user.
   * @returns A list of items with owner distance calculated in meters.
   */
  public async searchNearby(query: string, longitude: number, latitude: number): Promise<any[]> {
    if (isNaN(longitude) || isNaN(latitude)) {
        throw new Error("Invalid longitude or latitude provided.");
    }

    const searchPipeline = [
      
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'ownerDistance', 
          spherical: true,
          
        }
      },
      
      {
        $lookup: {
          from: 'items', 
          localField: '_id', 
          foreignField: 'owner', 
          as: 'items' 
        }
      },
      
      {
        $unwind: '$items'
      },
      
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$items', { ownerDistance: '$ownerDistance' }]
          }
        }
      },
      
      {
        $match: {
          $and: [
            { availabilityStatus: 'available' }, 
            {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }
      },
       
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      
      {
        $unwind: '$owner'
      }
    ];
    
    
    const results = await User.aggregate(searchPipeline as any[]);
    return results;
  }

  /**
   * Finds a single item by its ID.
   * @param itemId The ID of the item to find.
   */
  public async findById(itemId: string): Promise<IItem> {
    const item = await Item.findById(itemId).populate('owner', 'name profilePicture reputationScore');
    
    if (!item) {
      throw new Error('Item not found.');
    }
    
    return item;
  }

  
    /**
     * Finds all items across all communities.
     * Intended for the main search/explore page.
     */
    public async findAll(): Promise<IItem[]> {
      return Item.find({})
          .populate('owner', 'name profilePicture')
          .sort({ createdAt: -1 }); 
  }

  /**
     * Deletes an item if the requester is the owner.
     * Also deletes any pending borrow requests for that item.
     * @param itemId The ID of the item to delete.
     * @param userId The ID of the user attempting to delete the item.
     */
  public async delete(itemId: string, userId: string): Promise<void> {
    const item = await Item.findById(itemId);

    if (!item) {
        throw new Error('Item not found.');
    }

    if (item.owner.toString() !== userId) {
        throw new Error('You are not authorized to delete this item.');
    }
    
    
    if (item.availabilityStatus === 'borrowed') {
        throw new Error('Cannot delete an item that is currently borrowed.');
    }

    
    await Item.findByIdAndDelete(itemId);

    
    await BorrowRequest.deleteMany({ item: itemId, status: 'pending' });
}
}