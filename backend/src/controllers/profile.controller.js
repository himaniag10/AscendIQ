import {
  calculateProfileCompletion,
  getProfileByUserId,
  upsertProfile,
} from '../services/profile.service.js';
import { uploadProfileImage, uploadResume as uploadResumeToCloud, deleteCloudinaryAsset } from '../services/cloudinary.service.js';
import Profile from '../models/profile.model.js';
import User from '../models/user.model.js';

const formatProfile = (profile, user) => ({
  id: profile?._id || null,
  fullName: profile?.fullName || user.name,
  email: user.email,
  profileImageUrl: profile?.profileImageUrl || user.avatar || '',
  profileImagePublicId: profile?.profileImagePublicId || '',
  college: profile?.college || '',
  degree: profile?.degree || '',
  branch: profile?.branch || '',
  graduationYear: profile?.graduationYear || '',
  skills: profile?.skills || [],
  targetRole: profile?.targetRole || '',
  targetCompany: profile?.targetCompany || '',
  resumeUrl: profile?.resumeUrl || '',
  resumePublicId: profile?.resumePublicId || '',
  resumeFileName: profile?.resumeFileName || '',
  resumeUploadedAt: profile?.resumeUploadedAt || null,
  bio: profile?.bio || '',
  completion: calculateProfileCompletion(profile),
  isCompleted: calculateProfileCompletion(profile) >= 70,
  createdAt: profile?.createdAt || null,
  updatedAt: profile?.updatedAt || null,
});

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getProfileByUserId(req.user._id);
    res.status(200).json({
      success: true,
      profile: formatProfile(profile, req.user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await upsertProfile(req.user, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile saved successfully.',
      profile: formatProfile(profile, req.user),
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// Upload avatar
// -----------------------------------------------------------
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded.');
      err.statusCode = 400;
      throw err;
    }

    const profile = await Profile.findOne({ user: req.user._id });

    // delete existing asset if present
    if (profile?.profileImagePublicId) {
      await deleteCloudinaryAsset(profile.profileImagePublicId, 'image');
    } else if (profile?.profileImageUrl) {
      await deleteCloudinaryAsset(profile.profileImageUrl, 'image');
    } else if (req.user.avatar) {
      await deleteCloudinaryAsset(req.user.avatar, 'image');
    }

    const uploadResult = await uploadProfileImage(req.file, req.user._id);

    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          profileImageUrl: uploadResult.url,
          profileImagePublicId: uploadResult.publicId,
        },
        $setOnInsert: { user: req.user._id },
      },
      { new: true, upsert: true }
    );

    // also update user.avatar for consistency
    await User.findByIdAndUpdate(req.user._id, { $set: { avatar: uploadResult.url } });

    res.status(200).json({ success: true, message: 'Avatar uploaded successfully.', url: uploadResult.url, profile: formatProfile(updatedProfile, { ...req.user, avatar: uploadResult.url }) });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// Upload resume
// -----------------------------------------------------------
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded.');
      err.statusCode = 400;
      throw err;
    }

    const profile = await Profile.findOne({ user: req.user._id });

    if (profile?.resumePublicId) {
      await deleteCloudinaryAsset(profile.resumePublicId, 'raw');
    } else if (profile?.resumeUrl) {
      await deleteCloudinaryAsset(profile.resumeUrl, 'raw');
    }

    const uploadResult = await uploadResumeToCloud(req.file, req.user._id);

    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          resumeUrl: uploadResult.url,
          resumePublicId: uploadResult.publicId,
          resumeFileName: req.file.originalname,
          resumeUploadedAt: new Date(),
        },
        $setOnInsert: { user: req.user._id },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: 'Resume uploaded successfully.', url: uploadResult.url, profile: formatProfile(updatedProfile, req.user) });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// Delete avatar
// -----------------------------------------------------------
export const deleteAvatar = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const targetPublicId = profile?.profileImagePublicId;
    const targetUrl = profile?.profileImageUrl || req.user.avatar;
    if (!targetPublicId && !targetUrl) {
      return res.status(200).json({ success: true, message: 'No avatar to delete.' });
    }

    if (targetPublicId) {
      await deleteCloudinaryAsset(targetPublicId, 'image');
    } else {
      await deleteCloudinaryAsset(targetUrl, 'image');
    }

    await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { profileImageUrl: '', profileImagePublicId: '' } },
      { new: true }
    );
    await User.findByIdAndUpdate(req.user._id, { $set: { avatar: '' } });

    res.status(200).json({ success: true, message: 'Avatar deleted.' });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------
// Delete resume
// -----------------------------------------------------------
export const deleteResume = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    const targetPublicId = profile?.resumePublicId;
    const targetUrl = profile?.resumeUrl;
    if (!targetPublicId && !targetUrl) {
      return res.status(200).json({ success: true, message: 'No resume to delete.' });
    }

    if (targetPublicId) {
      await deleteCloudinaryAsset(targetPublicId, 'raw');
    } else {
      await deleteCloudinaryAsset(targetUrl, 'raw');
    }

    await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          resumeUrl: '',
          resumePublicId: '',
          resumeFileName: '',
          resumeUploadedAt: null,
        },
      },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Resume deleted.' });
  } catch (error) {
    next(error);
  }
};
