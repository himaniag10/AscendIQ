import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    profileImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    college: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'College cannot exceed 120 characters'],
    },
    degree: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Degree cannot exceed 80 characters'],
    },
    branch: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Branch cannot exceed 80 characters'],
    },
    graduationYear: {
      type: Number,
      min: [1950, 'Graduation year is too old'],
      max: [2100, 'Graduation year is too far in the future'],
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    targetRole: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Target role cannot exceed 100 characters'],
    },
    targetCompany: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Target company cannot exceed 100 characters'],
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    resumePublicId: {
      type: String,
      default: '',
      trim: true,
    },
    resumeFileName: {
      type: String,
      default: '',
      trim: true,
    },
    resumeUploadedAt: {
      type: Date,
      default: null,
    },
    profileImagePublicId: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [600, 'Bio cannot exceed 600 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
