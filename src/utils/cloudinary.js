import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (fileLocalPath) => {
  try {
    console.log("Uploading file to Cloudinary: ", fileLocalPath);
    if (!fileLocalPath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(fileLocalPath, {
      resource_type: "auto",
    });

    // Delete the local file after upload
    fs.unlinkSync(fileLocalPath);

    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary: ", error);
    if (fs.existsSync(fileLocalPath)) {
      fs.unlinkSync(fileLocalPath);
    }
    return null;
  }
};

const uploadVideoOnCloudinary = async (fileLocalPath) => {
  try {
    console.log("Uploading video to Cloudinary: ", fileLocalPath);
    if (!fileLocalPath) return null;

    // Upload the video to Cloudinary
    const response = await cloudinary.uploader.upload(fileLocalPath, {
      resource_type: "video",
    });

    // Delete the local file after upload
    fs.unlinkSync(fileLocalPath);

    return response;
  } catch (error) {
    console.error("Error uploading video to Cloudinary: ", error);
    if (fs.existsSync(fileLocalPath)) {
      fs.unlinkSync(fileLocalPath);
    }
    return null;
  }
};

// Utility function to delete files from Cloudinary
const deleteOldFileInCloudinary = async (imageURL) => {
  try {
    const oldImagePublicId = imageURL.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(oldImagePublicId, {
      resource_type: "image",
    });
    console.log("Delete result for image:", response);
    return response;
  } catch (error) {
    console.error("Error deleting image from Cloudinary: ", error);
    throw error;
  }
};

const deleteOldVideoFileInCloudinary = async (videoURL) => {
  try {
    const oldVideoPublicId = videoURL.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(oldVideoPublicId, {
      resource_type: "video",
    });
    console.log("Delete result for video:", response);
    return response;
  } catch (error) {
    console.error("Error deleting video from Cloudinary: ", error);
    throw error;
  }
};

export {
  uploadOnCloudinary,
  uploadVideoOnCloudinary,
  deleteOldFileInCloudinary,
  deleteOldVideoFileInCloudinary,
};
