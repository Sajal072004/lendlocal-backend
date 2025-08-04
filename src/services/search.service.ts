import { Community, ICommunity } from '../models/Community.model';
import { Item, IItem } from '../models/Item.model';
import { User, IUser } from '../models/User.model';

// Define a unified search result structure
export type SearchResult = 
  | { type: 'item'; data: IItem }
  | { type: 'community'; data: ICommunity }
  | { type: 'user'; data: IUser };

export class SearchService {
  /**
   * Searches for items, communities, and users based on a query string.
   * @param query The search term.
   * @param currentUserId The ID of the user performing the search to exclude them from user results.
   */
  public async searchAll(query: string, currentUserId: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const regex = new RegExp(query, 'i'); // Case-insensitive regex

    // Perform searches in parallel
    const [items, communities, users] = await Promise.all([
      Item.find({ name: regex }).populate('owner', 'name profilePicture'),
      Community.find({ name: regex }),
      User.find({ 
        name: regex, 
        _id: { $ne: currentUserId } // Exclude the current user from results
      }).select('name profilePicture')
    ]);

    // Format results with their type
    const formattedResults: SearchResult[] = [
      ...items.map(item => ({ type: 'item' as const, data: item })),
      ...communities.map(community => ({ type: 'community' as const, data: community })),
      ...users.map(user => ({ type: 'user' as const, data: user })),
    ];
    
    return formattedResults;
  }
}