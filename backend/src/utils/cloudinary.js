import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

dotenv.config({
  path: "backend/config/config.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folderPath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folderPath,
      resource_type: "auto",
    });
    // File has been uploaded successfully
    // console.log("File has been uploaded on Cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localFilePath); //Remove the locally saved temporary file as the upload operation failed
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    // Delete from Cloudinary
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.log(error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
