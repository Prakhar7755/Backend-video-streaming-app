import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Function to generate access and refresh tokens for a given user ID
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    // Generate access and refresh tokens for the user
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Update user's refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Save user without validation

    // Return the generated tokens
    return { accessToken, refreshToken };
  } catch (e) {
    // If an error occurs, throw a standardized internal server error
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

// Middleware function to handle user registration
const registerUser = asyncHandler(async (req, res) => {
  // Extract user details from request body
  const { fullName, email, username, password } = req.body;

  // Validate if all required fields are provided
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user with provided username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Extract avatar and cover image paths from request files
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  // Validate if avatar is provided
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload avatar and cover image to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Validate if avatar upload was successful
  if (!avatar) {
    throw new ApiError(400, "Avatar file upload failed");
  }

  // Create new user in the database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Find the created user and select only necessary fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Error while registering the user");
  }

  // Return successful response with created user data
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

// Middleware function to handle user login
const loginUser = asyncHandler(async (req, res) => {
  // Extract email/username and password from request body
  const { email, username, password } = req.body;

  // Validate if email/username is provided
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // Find user by email or username
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Validate user's password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate access and refresh tokens for the authenticated user
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Find the logged in user and select only necessary fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Set options for HTTP cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Set cookies with access and refresh tokens and return successful response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// Middleware function to handle user logout
const logoutUser = asyncHandler(async (req, res) => {
  // Remove refresh token from the user's document in the database
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 /*removes the field from the document*/ },
    },
    { new: true }
  );

  // Set options for HTTP cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Clear cookies and return successful response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// Refreshes access token using refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Extract refresh token from cookies or request body
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // If refresh token is not provided, throw unauthorized error
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    // Verify incoming refresh token
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user associated with the decoded refresh token
    const user = await User.findById(decodedToken?._id);

    // If user not found, throw invalid refresh token error
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    // If incoming refresh token does not match user's refresh token, throw expired or used error
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh Token is expired or used");
    }

    // Set cookie options for secure transmission
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Generate new access token and refresh token
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // Send response with new tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    // Catch and throw any errors occurred during token refresh
    throw new ApiError(401, "Invalid refresh token" || error?.message);
  }
});

// Changes user's current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Extract old and new passwords from request body
  const { oldPassword, newPassword /* ,confirmPassword */ } = req.body;

  // Find user by ID
  const user = await User.findById(req.user?._id);

  // Check if the provided old password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // Set new password and save user
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed successfully"));
});

// Gets details of the current user
const getCurrentUser = asyncHandler(async (req, res) => {
  // Return current user details
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

// Updates account details of the current user
const updateAccountDetails = asyncHandler(async (req, res) => {
  // Extract full name and email from request body
  const { fullName, email } = req.body;

  // If full name or email is missing, throw error
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  // Update user's account details
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  // Return success response with updated user details
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// Updates user's avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  // Get path of uploaded avatar file
  const avatarLocalPath = req.file?.path;

  // If avatar file is missing, throw error
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // If error occurred while uploading, throw error
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  // Update user's avatar URL
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // Return success response with updated user details
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

// Updates user's cover Image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Get path of uploaded cover image file
  const coverImageLocalPath = req.file?.path;

  // If cover image file is missing, throw error
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  // Upload cover image to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // If error occurred while uploading, throw error
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage");
  }

  // Update user's cover image URL
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  // Return success response with updated user details
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User coverImage updated successfully"));
});

// Gets user's channel profile details
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Extract username from request parameters
  const { username } = req.params;

  // If username is missing or empty, throw error
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // Aggregate query to get user's channel profile
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
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
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  // If channel doesn't exist, throw error
  if (!channel?.length) {
    throw new ApiError(404, "channel doesn't exist");
  }

  // Return success response with user's channel profile
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

// Gets user's watch history
const getWatchHistory = asyncHandler(async (req, res) => {
  // Aggregate query to get user's watch history
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.users._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
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
        ],
      },
    },
  ]);

  // If watch history not found, throw error
  if (!user[0]?.watchHistory) {
    throw new ApiError(404, "failed to fetch watch history");
  }

  // Return success response with user's watch history
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});

// Export middleware functions for user registration, login, and logout
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
