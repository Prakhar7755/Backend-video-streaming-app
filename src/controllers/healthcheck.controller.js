import { ApiResponse, asyncHandler } from "../utils/index.js";

const healthcheck = asyncHandler(async (req, res) => {
  // Health check response to confirm that the server is running

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "The server is up and running"));
});

export { healthcheck };
