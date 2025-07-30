import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const itemStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'LendLocal', // Folder name in Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg'] 
  } as any, // 'any' is used here due to a type mismatch in the library
});

// Uploader for Chat Images
const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'LendLocal/chat_images', // Separate folder for chat images
    allowedFormats: ['jpg', 'png', 'jpeg']
  } as any,
  
});

// Uploader for Profile Pictures
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'LendLocal/profile_pictures', // Separate folder
    allowedFormats: ['jpg', 'png', 'jpeg']
  } as any,
});

export const uploadProfilePhoto = multer({ storage: profileStorage });

export const uploadChatImage = multer({ storage: chatStorage });

export const uploadItemPhoto = multer({ storage: itemStorage });