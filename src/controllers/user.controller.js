import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Function to generate access and refresh tokens for a given user ID
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // Find user by ID
    const user = await User.findById(userId);
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
  if (!username || !email) {
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
      $set: { refreshToken: undefined },
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

// Export middleware functions for user registration, login, and logout
export { registerUser, loginUser, logoutUser };
