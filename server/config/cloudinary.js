import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'edutech/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
  },
});

// Storage for PDFs/notes
const notesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'edutech/notes',
    resource_type: 'raw',
    allowed_formats: ['pdf', 'doc', 'docx'],
  },
});

// Storage for payment screenshots
const paymentScreenshotStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'edutech/payments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

// Storage for thumbnails
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'edutech/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

// Multer upload instances
export const uploadVideo = multer({ storage: videoStorage });
export const uploadNotes = multer({ storage: notesStorage });
export const uploadPaymentScreenshot = multer({ storage: paymentScreenshotStorage });
export const uploadThumbnail = multer({ storage: thumbnailStorage });

export default cloudinary;
