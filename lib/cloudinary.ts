import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64Data: string, mediaType: string): Promise<string> {
  const dataUri = `data:${mediaType};base64,${base64Data}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'preloved-kids',
    transformation: [
      { width: 800, height: 600, crop: 'limit', quality: 'auto' }
    ],
  });
  return result.secure_url;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
