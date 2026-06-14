import multer from 'multer';

const storage = multer.memoryStorage();

const createFileError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createUpload = ({ allowedMimeTypes, maxSize, label }) => multer({
  storage,
  limits: {
    fileSize: maxSize,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(createFileError(`Invalid ${label} file type.`));
      return;
    }
    cb(null, true);
  },
});

const handleMulterSingle = (upload, fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File size exceeds the allowed limit.';
        error.statusCode = 400;
      }
      return next(error);
    }
    if (error) return next(error);
    next();
  });
};

const avatarUpload = createUpload({
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxSize: 2 * 1024 * 1024,
  label: 'avatar',
});

const resumeUpload = createUpload({
  allowedMimeTypes: ['application/pdf'],
  maxSize: 5 * 1024 * 1024,
  label: 'resume',
});

export const uploadAvatar = handleMulterSingle(avatarUpload, 'avatar');
export const uploadResume = handleMulterSingle(resumeUpload, 'resume');
