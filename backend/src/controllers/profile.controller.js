import {
  calculateProfileCompletion,
  getProfileByUserId,
  upsertProfile,
} from '../services/profile.service.js';

const formatProfile = (profile, user) => ({
  id: profile?._id || null,
  fullName: profile?.fullName || user.name,
  email: user.email,
  profileImageUrl: profile?.profileImageUrl || user.avatar || '',
  college: profile?.college || '',
  degree: profile?.degree || '',
  branch: profile?.branch || '',
  graduationYear: profile?.graduationYear || '',
  skills: profile?.skills || [],
  targetRole: profile?.targetRole || '',
  targetCompany: profile?.targetCompany || '',
  resumeUrl: profile?.resumeUrl || '',
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
