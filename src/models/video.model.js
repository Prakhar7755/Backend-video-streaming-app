import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; // Plugin for aggregation pipeline support

// Define the schema for the video model
const videoSchema = new mongoose.Schema(
  {
    // URL of the video file (Cloudinary URL)
    videoFile: {
      type: String,
      required: true,
    },
    // URL of the thumbnail image (Cloudinary URL)
    thumbnail: {
      type: String,
      required: true,
    },
    // Title of the video
    title: {
      type: String,
      required: true,
    },
    // Description of the video
    description: {
      type: String,
      required: true,
    },
    // Duration of the video (in seconds)
    duration: {
      type: Number,
      required: true,
    },
    // Number of views for the video
    views: {
      type: Number,
      default: 0,
    },
    // Indicates whether the video is published or not
    isPublished: {
      type: Boolean,
      default: true,
    },
    // Reference to the owner of the video (User model)
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } // Timestamps for creation and update
);

// Plugin to enable pagination in aggregation pipelines
videoSchema.plugin(mongooseAggregatePaginate);

// Create and export the Video model
export const Video = mongoose.model("Video", videoSchema);
