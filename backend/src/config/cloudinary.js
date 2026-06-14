import { v2 as cloudinary } from 'cloudinary';

const normalizeCloudinaryUrl = (value) => {
  if (!value) return value;
  return value.startsWith('CLOUDINARY_URL=') ? value.replace('CLOUDINARY_URL=', '') : value;
};

const cloudinaryUrl = normalizeCloudinaryUrl(process.env.CLOUDINARY_URL);

if (cloudinaryUrl) {
  cloudinary.config({ cloudinary_url: cloudinaryUrl, secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export default cloudinary;
