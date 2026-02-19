import cloudinary from '../config/cloudinary.js';
import ErrorHandler from './errorHandler.js';


const uploadToCloudinary = async (imagePathOrBuffer, mimetype, folder) => {
  // Accepts either a file path (string) or a buffer
  let uploadOptions = { folder, resource_type: "auto" };
  let uploadSource = imagePathOrBuffer;
  
  // If it's a buffer, convert to data URI
  if (Buffer.isBuffer(imagePathOrBuffer)) {
    const b64 = imagePathOrBuffer.toString("base64");
    // Use the provided mimetype or default to image/jpeg
    const mimeType = mimetype || 'image/jpeg';
    uploadSource = `data:${mimeType};base64,${b64}`;
    console.log(`📤 Uploading buffer with mimetype: ${mimeType}`);
  }
  
  try {
    console.log(`🚀 Starting Cloudinary upload to folder: ${folder}`);
    console.log(`🔑 Cloudinary Config - Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    
    const result = await cloudinary.uploader.upload(uploadSource, uploadOptions);
    
    console.log(`✅ Upload successful - URL: ${result.secure_url}`);
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error details:');
    console.error('  - Message:', error.message);
    console.error('  - HTTP Status:', error.http_code);
    console.error('  - Full Error:', error);
    throw new ErrorHandler(`Failed to upload image to Cloudinary: ${error.message}`, 500);
  }
};

const destroyFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary destroy utility error:', error);
    throw new ErrorHandler('Failed to delete image from Cloudinary.', 500);
  }
};

export { uploadToCloudinary, destroyFromCloudinary };
