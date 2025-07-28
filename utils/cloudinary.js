// utils/cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


console.log("Cloudinary Config Loaded:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "✔ Loaded" : "❌ Missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✔ Loaded" : "❌ Missing"
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The buffer of the file to upload.
 * @param {object} options - Options for the Cloudinary upload (e.g., { resource_type: 'auto', folder: 'trips' }).
 * @returns {Promise<object>} A promise that resolves with the Cloudinary upload result.
 */
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Use upload_stream to upload from a buffer. It's more efficient for this use case.
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    // Use streamifier to pipe the buffer to Cloudinary's upload stream
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};


// Configure multer for memory storage to handle files as buffers in memory
const storage = multer.memoryStorage();

// Filter files to allow only the specific image and document MIME types you need
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    // Reject the file with a specific, helpful error
    cb(new Error('Invalid file type. Only images (jpeg, png, webp) and documents (pdf, doc, docx) are allowed.'), false);
  }
};

// Export the configured multer instance for use in your routes
export const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Optional: Add a file size limit (e.g., 10MB)
});

export default cloudinary;
