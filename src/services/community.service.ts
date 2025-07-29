import { Community, ICommunity } from '../models/Community.model';
import { User } from '../models/User.model';


export class CommunityService {
  /**
   * Creates a new community.
   */
  public async create(name: string, description: string, ownerId: string): Promise<ICommunity> {
    // 1. Dynamically import nanoid
    const { customAlphabet } = await import('nanoid');
    const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ123456789', 6);
    const inviteCode = nanoid();

    const community = await Community.create({
      name,
      description,
      owner: ownerId,
      members: [ownerId],
      admins: [ownerId], // Assuming admin role from previous discussion
      inviteCode,
    });

    await User.findByIdAndUpdate(ownerId, { $addToSet: { communities: community._id } });

    return community;
  }

  /**
   * Allows a user to join an existing community using an invite code.
   */
  public async join(inviteCode: string, userId: string): Promise<ICommunity> {
    // 2. Use findOneAndUpdate with $addToSet for an atomic and safer operation
    const community = await Community.findOneAndUpdate(
      { inviteCode },
      { $addToSet: { members: userId, admins: userId } }, // Add user to members and make them an admin
      { new: true } // Return the updated document
    );

    if (!community) {
      throw new Error('Community not found with this invite code.');
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { communities: community._id } });

    return community;
  }

  /**
   * Finds all communities a user is a member of.
   */
  public async findByUser(userId: string): Promise<ICommunity[]> {
    return Community.find({ members: userId });
  }

  /**
   * Finds a single community by its ID, ensuring the user is a member.
   */
  public async findById(communityId: string, userId: string): Promise<ICommunity | null> {
    const community = await Community.findById(communityId).populate('members', 'name profilePicture');

    if (!community) {
      throw new Error('Community not found.');
    }
    
    // 3. This check is correct because 'members' is populated. No change needed here.
    if (!community.members.some(member => (member as any)._id.toString() === userId)) {
        throw new Error('Not authorized to view this community.');
    }
    
    return community;
  }
}