import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/* asyncHandler is a higher order function */
const registerUser = asyncHandler(async (req, res) => {
  /* return res.status(200).json({
    message: "CHAI AUR CODE",
  }); */
  /* STEPS TO REGISTER or algorithm for this 
  
  1) GET USER DETAIL FROM FRONTEND 
  2) validation - not empty
  3) check if user already exist: username, email
  4) check for images, check for avatar
  5) upload them to cloudinary, check if avatar uploaded
  6) create user obj- create entry in db
  7) remove password and refresh token field from response
  8) check for user creation 
  9) return response
  
  */

  const { fullName, email, username, password } = req.body;
  // console.log(`email:`, email);    CHECK

  /* if (fullName === "") {
    throw new ApiError(400, "FullName is required");
  } */
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  // console.log(req.files);


  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  /* METHOD IS MADE ASYNC BECAUSE OF THIS ONLY */
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" /*these two fields will not be selected*/
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return res.status(201).json({createdUser})     OR
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
