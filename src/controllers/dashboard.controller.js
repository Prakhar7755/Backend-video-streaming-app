import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const channelId = req.user?._id; // Assumes the user is logged in and their ID is used to get the stats

  if (!channelId || !mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const [channelStats] = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "allVideos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likesCount: { $size: "$likes" },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        totalSubscribers: { $size: "$subscribers" },
        totalVideos: { $size: "$allVideos" },
        totalViews: { $sum: "$allVideos.views" },
        totalLikes: { $sum: "$allVideos.likesCount" },
      },
    },
    {
      $project: {
        totalVideos: 1,
        totalViews: 1,
        totalLikes: 1,
        totalSubscribers: 1,
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channelStats) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel stats retrieved successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // Get all the videos uploaded by the channel

  const channelId = req.user?._id; // Assumes the user is logged in and their ID is used to get the videos

  if (!channelId || !mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        likes: 0,
      },
    },
  ]);

  if (videos.length === 0) {
    throw new ApiError(404, "No videos found for this channel");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos retrieved successfully"));
});

export { getChannelStats, getChannelVideos };
