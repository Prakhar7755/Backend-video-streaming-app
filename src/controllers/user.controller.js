import { asyncHandler } from "../utils/asyncHandler.js";

/* asyncHandler is a higher order function */
const registerUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    message: "CHAI AUR CODE",
  });
});

export { registerUser };
