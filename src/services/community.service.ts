import { Community, ICommunity } from '../models/Community.model';
import { IJoinRequest, JoinRequest } from '../models/JoinRequestModel';
import { User } from '../models/User.model';
import { NotificationService } from './notification.service';


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

  public async findById(communityId: string, userId: string): Promise<any> {
    const community = await Community.findById(communityId)
      .populate('members', 'name profilePicture')
      .lean(); 

    if (!community) {
      throw new Error('Community not found.');
    }

    const pendingRequest = await JoinRequest.findOne({
      community: communityId,
      user: userId,
      status: 'pending'
    });

    const result = {
      ...community,
      isMember: community.members.some(member => (member as any)._id.toString() === userId),
      hasPendingRequest: !!pendingRequest
    };

    return result;
  }

  /**
   * Gets the invite code for a community, ensuring the user is a member.
   */
  public async getInviteCode(communityId: string, userId: string): Promise<string> {
    const community = await Community.findOne({ _id: communityId, members: userId });

    if (!community) {
      throw new Error('Community not found or you are not a member.');
    }

    return community.inviteCode;
  }

 /**
   * Finds all communities and enriches them with user-specific join request status.
   */
 public async findAll(userId: string): Promise<any[]> {
  const communities = await Community.find()
    .select('name description members owner').sort({ createdAt: -1 })
    .lean(); // Use lean for better performance and easier modification

  // Get all pending requests for the current user
  const userPendingRequests = await JoinRequest.find({
    user: userId,
    status: 'pending'
  }).select('community').sort({ createdAt: -1 });

  const pendingRequestCommunityIds = new Set(
    userPendingRequests.map(req => (req.community as any).toString())
  );

  // Add a 'hasPendingRequest' flag to each community object
  const results = communities.map(community => ({
    ...community,
    memberCount: community.members.length,
    hasPendingRequest: pendingRequestCommunityIds.has(community._id.toString()),
  }));

  return results;
}


  public async requestToJoin(communityId: string, userId: string): Promise<IJoinRequest> {
    const community = await Community.findById(communityId);
    if (!community) throw new Error('Community not found.');

    const isMember = community.members.some(memberId => memberId.toString() === userId);
    if (isMember) throw new Error('You are already a member of this community.');

    const joinRequest = await JoinRequest.create({ community: communityId, user: userId });

    const notificationService = new NotificationService();

    await notificationService.createNotification({
        recipient: community.owner.toString(),
        sender: userId,
        type: 'new_join_request',
        message: `has requested to join your community "${community.name}".`,
        link: `/community/${communityId}`
    });

    return joinRequest;
  }

  public async getJoinRequests(communityId: string, ownerId: string): Promise<IJoinRequest[]> {
    const community = await Community.findById(communityId);
    if (!community || community.owner.toString() !== ownerId) {
        throw new Error('Not authorized to view join requests.');
    }
    return JoinRequest.find({ community: communityId, status: 'pending' }).populate('user', 'name profilePicture').sort({ createdAt: -1 });
  }

  public async respondToJoinRequest(requestId: string, ownerId: string, response: 'approve' | 'reject'): Promise<IJoinRequest> {
    const request = await JoinRequest.findById(requestId).populate('community');
    if (!request) throw new Error('Request not found.');
    
    const community = request.community as unknown as ICommunity;
    if (community.owner.toString() !== ownerId) {
        throw new Error('Not authorized to respond to this request.');
    }

    if (response === 'approve') {
        request.status = 'approved';
        await Community.findByIdAndUpdate(community._id, { $addToSet: { members: request.user } });
        await User.findByIdAndUpdate(request.user, { $addToSet: { communities: community._id } });
    } else {
        request.status = 'rejected';
    }

    await request.save();
    return request;
  }


  // --- ADD THIS NEW METHOD ---
  /**
   * Updates a community's details.
   * @param communityId The ID of the community to update.
   * @param ownerId The ID of the user making the request (must be the owner).
   * @param updates An object containing the new name and/or description.
   */
  public async update(communityId: string, ownerId: string, updates: { name?: string; description?: string }): Promise<ICommunity> {
    const community = await Community.findById(communityId);

    if (!community) {
      throw new Error('Community not found.');
    }

    if (community.owner.toString() !== ownerId) {
      throw new Error('You are not authorized to edit this community.');
    }

    // Update the fields if they are provided
    if (updates.name) community.name = updates.name;
    if (updates.description) community.description = updates.description;

    await community.save();
    return community;
  }
  


  
}