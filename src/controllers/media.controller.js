import logger from "../utils/logger.util.js";
import { Media } from "../models/media.model.js";
import {uploadOnCloudinary} from "../utils/clodinary.util.js"

const uploadMedia = async (req, res) => {
  try {
    logger.info("Upload Media");

    // Check if file exists in request
    const mediaLocalPath = req.file?.path;
    if (!mediaLocalPath) {
      logger.warn("No file uploaded");
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Upload to cloudinary
    const media = await uploadOnCloudinary(mediaLocalPath);
    console.log("Cloudinary response:", media);

    if (!media) {
      logger.warn("Error uploading media to cloudinary");
      return res.status(500).json({ success: false, message: "Error uploading media" });
    }

    // Save in DB
    const createdMedia = await Media.create({
      originalName: media.original_filename,
      size: media.bytes, // Cloudinary returns "bytes"
      userId: req.user.userId, // make sure proxy sets this correctly
      url: media.secure_url, // prefer secure_url over url
      mimeType: req.file.mimetype, // reliable MIME from multer
      publicId: media.public_id,   // save this for easier deletion
    });

    logger.info("Media uploaded successfully");
    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      data: createdMedia,
    });

  } catch (error) {
    logger.error("Upload Media Error: ", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export {
    uploadMedia,
}