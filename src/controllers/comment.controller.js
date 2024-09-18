import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { Tweet } from "../models/tweet.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is required or invalid");
  }

  page = isNaN(page) || page <= 0 ? 1 : Number(page);
  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);

  const videoComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, videoComments, "Get video comments success"));
});

const addCommentToVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId || !isValidObjectId(videoId))
    throw new ApiError(400, "Video ID is required or invalid");

  if (!content || content.trim() === "")
    throw new ApiError(400, "Content is required and cannot be empty");

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const userComment = await Comment.create({
    content: content.trim(),
    video: video._id,
    owner: req.user?._id,
  });

  if (!userComment) {
    throw new ApiError(500, "Something went wrong while posting the comment");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, userComment, "Comment added to video successfully")
    );
});

const addCommentToTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID is required or invalid");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required and cannot be empty");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const userComment = await Comment.create({
    content: content.trim(),
    tweet: tweet._id,
    owner: req.user?._id,
  });

  if (!userComment) {
    throw new ApiError(500, "Something went wrong while posting the comment");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, userComment, "Comment added to tweet successfully")
    );
});

const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID is required or invalid");
  }

  page = isNaN(page) || page <= 0 ? 1 : Number(page);
  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);

  const tweetComments = await Comment.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, tweetComments, "Get tweet comments success"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId, content } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment ID is required or invalid");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required and cannot be empty");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content.trim(),
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment ID is required or invalid");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export {
  getVideoComments,
  getTweetComments,
  addCommentToVideo,
  addCommentToTweet,
  updateComment,
  deleteComment,
};
