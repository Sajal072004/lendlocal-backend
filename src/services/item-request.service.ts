import { ItemRequest, IItemRequest, IOffer } from '../models/ItemRequest.model';
import { Community } from '../models/Community.model';
import { User } from '../models/User.model';
import { BorrowRequest, IBorrowRequest } from '../models/BorrowRequest.model';
import { Item } from '../models/Item.model';
import { NotificationService } from './notification.service';
const notificationService = new NotificationService();

// --- Interfaces for data transfer ---
interface ICreateRequestData {
  requesterId: string;
  communityId: string;
  title: string;
  description: string;
}

interface IAddOfferData {
  offeredById: string;
  itemRequestId: string;
  message?: string;
}

export class ItemRequestService {
  /**
   * Creates a new "in-search-of" item request.
   */
  public async create(data: ICreateRequestData): Promise<IItemRequest> {
    const { requesterId, communityId, title, description } = data;

    // 1. Verify the user is a member of the community.
    const community = await Community.findOne({ _id: communityId, members: requesterId });
    if (!community) {
      throw new Error('You must be a member of this community to post a request.');
    }

    // 2. Create the new item request.
    const itemRequest = await ItemRequest.create({
      requester: requesterId,
      community: communityId,
      title,
      description,
    });

    return itemRequest.populate('requester', 'name profilePicture');
  }

  /**
   * Finds all open requests within a specific community.
   */
  public async findAllOpenByCommunity(communityId: string, userId: string): Promise<IItemRequest[]> {
    // Verify the user is a member of the community to see its requests.
    const community = await Community.findOne({ _id: communityId, members: userId });
    if (!community) {
      throw new Error('You must be a member of this community to view its requests.');
    }

    return ItemRequest.find({ community: communityId, status: 'open' })
      .populate('requester', 'name profilePicture')
      .sort({ createdAt: -1 });
  }

  /**
   * Adds an offer to an existing item request.
   */
  public async addOffer(data: IAddOfferData): Promise<IItemRequest> {
    const { itemRequestId, offeredById, message } = data;

    const itemRequest = await ItemRequest.findById(itemRequestId);

    if (!itemRequest) {
      throw new Error('Item Request not found.');
    }
    if (itemRequest.status !== 'open') {
        throw new Error('This request is no longer open to offers.');
    }

    // Prevent the requester from offering on their own request.
    if (itemRequest.requester.toString() === offeredById) {
      throw new Error('You cannot make an offer on your own request.');
    }

    const offer: IOffer = {
      offeredBy: offeredById as any,
      message,
      createdAt: new Date(),
    };

    itemRequest.offers.push(offer);
    await itemRequest.save();

    // In the future, we would add a notification here to alert the requester.

    await notificationService.createNotification({
      recipient: itemRequest.requester.toString(),
      sender: offeredById,
      type: 'new_offer',
      message: `You have a new offer for your request: "${itemRequest.title}".`,
      link: `/item-requests/${itemRequest._id}`
  });

    return itemRequest.populate('offers.offeredBy', 'name profilePicture');
  }

  /**
   * Allows the original requester to accept an offer.
   * This action fulfills the request and creates a formal borrow transaction.
   * @param itemRequestId - The ID of the item request.
   * @param offerId - The ID of the offer being accepted.
   * @param requesterId - The ID of the user accepting the offer (must be the original requester).
   * @returns The newly created and approved borrow request.
   */
  public async acceptOffer(
    itemRequestId: string,
    offerId: string,
    requesterId: string
  ): Promise<IBorrowRequest> {
    const itemRequest = await ItemRequest.findById(itemRequestId);

    // 1. Validation checks
    if (!itemRequest) throw new Error('Item Request not found.');
    if (itemRequest.status !== 'open') throw new Error('This request is no longer open.');
    if (itemRequest.requester.toString() !== requesterId) {
      throw new Error('You are not authorized to accept offers for this request.');
    }

    const offer = itemRequest.offers.find((o: any) => o._id?.toString() === offerId);
    if (!offer) throw new Error('Offer not found.');

    // 2. Create a temporary, unlisted item to represent this loan
    const tempItem = await Item.create({
      name: `Loan for: "${itemRequest.title}"`,
      description: `This is a temporary item created to track the loan for the request: ${itemRequest.description}`,
      category: 'Loan', // A generic category for these types of items
      owner: offer.offeredBy, // The person who made the offer owns the item
      community: itemRequest.community,
      availabilityStatus: 'borrowed', // It's immediately marked as borrowed
    });

    // 3. Create an 'approved' BorrowRequest to formalize the transaction
    const borrowRequest = await BorrowRequest.create({
      item: tempItem._id,
      borrower: itemRequest.requester, // The original requester is the borrower
      lender: offer.offeredBy, // The person who made the offer is the lender
      status: 'approved', // The request is automatically approved
    });
    
    // 4. Update the original ItemRequest status to 'fulfilled'
    itemRequest.status = 'fulfilled';
    await itemRequest.save();
    
    // (Future step: send notifications to both users)

     // --- NOTIFICATION ---
     await notificationService.createNotification({
      recipient: offer.offeredBy.toString(), // Notify the person who made the offer
      sender: requesterId,
      type: 'offer_accepted',
      message: `Your offer for "${itemRequest.title}" has been accepted!`,
      link: `/requests/${borrowRequest._id}` // Link to the new formal request
  });
  // --------------------

    return borrowRequest.populate(['item', 'borrower', 'lender']);
  }
}