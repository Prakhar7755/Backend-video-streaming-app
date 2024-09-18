import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";

// Handle subscription toggle
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, `Invalid channel ID format: ${channelId}`);
  }

  // Check if the user is already subscribed
  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    // Unsubscribe if already subscribed
    const unsubscribed = await Subscription.findByIdAndDelete(
      existingSubscription._id
    );
    if (!unsubscribed) {
      throw new ApiError(500, "Error occurred while unsubscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  } else {
    // Subscribe if not already subscribed
    const subscription = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (!subscription) {
      throw new ApiError(500, "Error occurred while subscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, subscription, "Subscribed successfully"));
  }
});

// Get subscribers of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, `Invalid channel ID format: ${channelId}`);
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "allSubscribers",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$allSubscribers",
    },
    {
      $replaceRoot: { newRoot: "$allSubscribers" },
    },
  ]);

  if (subscribers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No subscribers found for this channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers retrieved successfully")
    );
});

// Get channels to which a user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, `Invalid subscriber ID format: ${subscriberId}`);
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "allChannels",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$allChannels",
    },
    {
      $replaceRoot: { newRoot: "$allChannels" },
    },
  ]);

  if (subscribedChannels.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "No subscribed channels found for this user")
      );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels retrieved successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
