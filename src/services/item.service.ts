import { Item, IItem } from '../models/Item.model';
import { Community } from '../models/Community.model';
import { User } from '../models/User.model';

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

  // lendlocal-backend/src/services/item.service.ts

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
      // 1. Start with a geospatial search on the 'users' collection
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'ownerDistance', // This field will hold the calculated distance
          spherical: true,
          // Optional: maxDistance: 50000 // Limit search to 50km
        }
      },
      // 2. Join with the 'items' collection to find items owned by these nearby users
      {
        $lookup: {
          from: 'items', // The name of the items collection
          localField: '_id', // The 'user' _id
          foreignField: 'owner', // The 'owner' field on the item
          as: 'items' // The array of items owned by the user
        }
      },
      // 3. Unwind the items array to de-normalize the data
      {
        $unwind: '$items'
      },
      // 4. Replace the root to promote the item to the top level
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$items', { ownerDistance: '$ownerDistance' }]
          }
        }
      },
      // 5. Match against the user's text query
      {
        $match: {
          $and: [
            { availabilityStatus: 'available' }, // Only show available items
            {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }
      },
       // 6. Final lookup to populate the owner details back into the item
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner'
        }
      },
      // 7. Deconstruct the owner array
      {
        $unwind: '$owner'
      }
    ];
    
    // We must execute the aggregation on the User model because $geoNear must be the first stage
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

  // --- ADD THIS NEW METHOD ---
    /**
     * Finds all items across all communities.
     * Intended for the main search/explore page.
     */
    public async findAll(): Promise<IItem[]> {
      return Item.find({})
          .populate('owner', 'name profilePicture')
          .sort({ createdAt: -1 }); // Sort by newest first
  }
}