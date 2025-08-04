import { Follow } from '../models/Follow.model';
import { IUser } from '../models/User.model';

import { NotificationService } from './notification.service';
const notificationService = new NotificationService();

export class FollowService {
  /**
   * Creates a follow relationship.
   * @param followerId The user initiating the follow.
   * @param followingId The user being followed.
   */
  public async followUser(followerId: string, followingId: string): Promise<any> {
    // Prevent users from following themselves
    if (followerId === followingId) {
      throw new Error("You cannot follow yourself.");
    }
    // The unique index on the model will prevent duplicates
    const follow = await Follow.create({ follower: followerId, following: followingId });

    // --- NOTIFICATION ---
    await notificationService.createNotification({
      recipient: followingId, // The user who is being followed
      sender: followerId,
      type: 'new_follower',
      message: `You have a new follower!`,
      link: `/user/${followerId}/profile`
  });
  // --------------------


    return follow;
  }

  /**
   * Removes a follow relationship.
   * @param followerId The user initiating the unfollow.
   * @param followingId The user being unfollowed.
   */
  public async unfollowUser(followerId: string, followingId: string): Promise<any> {
    const result = await Follow.deleteOne({ follower: followerId, following: followingId });
    if (result.deletedCount === 0) {
        throw new Error("You are not following this user.");
    }
    return result;
  }

  /**
   * Gets a list of all users who are following the given user.
   * @param userId The user whose followers to find.
   */
  public async getFollowers(userId: string): Promise<any> {
    return Follow.find({ following: userId }).populate('follower', 'name profilePicture').sort({ createdAt: -1 });
  }

  /**
   * Gets a list of all users that the given user is following.
   * @param userId The user whose followed accounts to find.
   */
  public async getFollowing(userId: string): Promise<any> {
    return Follow.find({ follower: userId }).populate('following', 'name profilePicture').sort({ createdAt: -1 });
  }
}