import dotenv from 'dotenv';
dotenv.config({ path: './config.env' }); // ✅ Load .env first

import { v2 as cloudinary } from 'cloudinary';

// Log Cloudinary config on startup
console.log('🔧 Cloudinary Configuration:');
console.log(`  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`  API Key: ${process.env.CLOUDINARY_API_KEY?.substring(0, 5)}...`);
console.log(`  API Secret: ${process.env.CLOUDINARY_API_SECRET?.substring(0, 5)}...`);

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ MISSING CLOUDINARY CREDENTIALS IN .env FILE!');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('✅ Cloudinary configured successfully');

export default cloudinary;
