import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_FOLDERS } from '../config/cloudinaryFolders.js';

dotenv.config({ path: './config.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createFolders = async () => {
  const folders = [
    CLOUDINARY_FOLDERS.PROFILES.USERS,
    CLOUDINARY_FOLDERS.PROFILES.ADMINS,
    CLOUDINARY_FOLDERS.PROFILES.OFFICERS,
    CLOUDINARY_FOLDERS.COMPLAINTS.EVIDENCE,
    CLOUDINARY_FOLDERS.COMPLAINTS.RESOLUTION,
    CLOUDINARY_FOLDERS.MEDIA,
    CLOUDINARY_FOLDERS.TESTS
  ];

  for (const folder of folders) {
    try {
      const result = await cloudinary.api.create_folder(folder);
      console.log(`✅ Created folder: ${result.path}`);
    } catch (error) {
      console.error(`⚠️  Error creating ${folder}: ${error.message}`);
    }
  }
};

createFolders();