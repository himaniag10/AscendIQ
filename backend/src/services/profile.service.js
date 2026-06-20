import Profile from '../models/profile.model.js';

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
};

const buildProfilePayload = (data, user) => {
  const payload = {
    fullName: data.fullName?.trim() || user.name,
    email: user.email,
    profileImageUrl: data.profileImageUrl?.trim() || user.avatar || '',
    college: data.college?.trim() || '',
    degree: data.degree?.trim() || '',
    branch: data.branch?.trim() || '',
    graduationYear: data.graduationYear ? Number(data.graduationYear) : null,
    skills: normalizeSkills(data.skills),
    targetRole: data.targetRole?.trim() || '',
    targetCompany: data.targetCompany?.trim() || '',
    resumeUrl: data.resumeUrl?.trim() || '',
    bio: data.bio?.trim() || '',
  };

  if (data.resumeFileName !== undefined) {
    payload.resumeFileName = data.resumeFileName?.trim() || '';
  }
  if (data.resumePublicId !== undefined) {
    payload.resumePublicId = data.resumePublicId?.trim() || '';
  }
  if (data.resumeUploadedAt !== undefined) {
    payload.resumeUploadedAt = data.resumeUploadedAt ? new Date(data.resumeUploadedAt) : null;
  }

  return payload;
};

export const getProfileByUserId = async (userId) => {
  return Profile.findOne({ user: userId });
};

export const upsertProfile = async (user, data) => {
  const payload = buildProfilePayload(data, user);
  return Profile.findOneAndUpdate(
    { user: user._id },
    { $set: payload, $setOnInsert: { user: user._id } },
    { new: true, upsert: true, runValidators: true }
  );
};

export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    profile.fullName,
    profile.email,
    profile.profileImageUrl,
    profile.college,
    profile.degree,
    profile.branch,
    profile.graduationYear,
    profile.skills?.length,
    profile.targetRole,
    profile.targetCompany,
    profile.resumeUrl,
    profile.bio,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
};
