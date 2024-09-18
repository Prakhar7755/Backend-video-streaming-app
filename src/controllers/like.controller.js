import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const existingLike = await Like.findOne({
    likedBy: new mongoose.Types.ObjectId(userId),
    video: new mongoose.Types.ObjectId(videoId),
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked successfully"));
  } else {
    await Like.create({
      likedBy: userId,
      video: videoId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(userId) || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid User or Comment ID");
  }

  const existingLike = await Like.findOne({
    likedBy: new mongoose.Types.ObjectId(userId),
    comment: new mongoose.Types.ObjectId(commentId),
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  } else {
    await Like.create({
      likedBy: userId,
      comment: commentId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(userId) || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid User or Tweet ID");
  }

  const existingLike = await Like.findOne({
    likedBy: new mongoose.Types.ObjectId(userId),
    tweet: new mongoose.Types.ObjectId(tweetId),
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unliked successfully"));
  } else {
    await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "AllVideos",
      },
    },
    {
      $unwind: "$AllVideos",
    },
    {
      $project: {
        _id: "$AllVideos._id",
        owner: "$AllVideos.owner",
        title: "$AllVideos.title",
        videoFile: "$AllVideos.videoFile",
        createdAt: "$AllVideos.createdAt",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "All liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
