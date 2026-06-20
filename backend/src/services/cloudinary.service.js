import path from 'path';
import cloudinary from '../config/cloudinary.js';

const uploadBuffer = ({ buffer, folder, resourceType, publicId }) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export const buildPublicIdFromUrl = (url, resourceType = 'image') => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const uploadMarker = resourceType === 'raw' ? '/raw/upload/' : '/image/upload/';
    const uploadIndex = parsed.pathname.indexOf(uploadMarker);
    if (uploadIndex === -1) return null;

    let publicId = parsed.pathname.slice(uploadIndex + uploadMarker.length);
    publicId = publicId.replace(/^v\d+\//, '');
    publicId = decodeURIComponent(publicId);

    if (resourceType === 'image') {
      publicId = publicId.replace(/\.[^/.]+$/, '');
    }

    return publicId || null;
  } catch {
    return null;
  }
};

const isPublicId = (value) => typeof value === 'string' && value !== '' && !value.startsWith('http');

export const deleteCloudinaryAsset = async (urlOrPublicId, resourceType = 'image') => {
  if (!urlOrPublicId) return null;
  const publicId = isPublicId(urlOrPublicId)
    ? urlOrPublicId
    : buildPublicIdFromUrl(urlOrPublicId, resourceType);

  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const uploadProfileImage = async (file, userId) => {
  const result = await uploadBuffer({
    buffer: file.buffer,
    folder: 'ascendiq/profile-images',
    resourceType: 'image',
    publicId: `${userId}-avatar-${Date.now()}`,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const uploadResume = async (file, userId) => {
  const ext = path.extname(file.originalname) || '.pdf';
  const result = await uploadBuffer({
    buffer: file.buffer,
    folder: 'ascendiq/resumes',
    resourceType: 'raw',
    publicId: `${userId}-resume-${Date.now()}${ext}`,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};
