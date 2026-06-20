import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // 'learning' or 'placement'
    mode: {
      type: String,
      enum: ['learning', 'placement'],
      required: [true, 'Interview mode is required'],
    },

    // Learning Mode fields
    topic: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', ''],
      default: '',
    },

    // Placement Mode fields
    company: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      trim: true,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['Intern', 'Fresher', '1 Year', '2+ Years', ''],
      default: '',
    },
    round: {
      type: String,
      enum: ['Online Assessment', 'Technical Round', 'HR Round', 'System Design', 'Mixed', ''],
      default: '',
    },

    firstQuestion: {
      type: String,
      default: '',
    },

    duration: {
      type: Number,
      default: 15, // in minutes
    },

    // Post-interview analysis
    readiness: {
      technicalAccuracy: { type: Number, min: 0, max: 100, default: 0 },
      communication: { type: Number, min: 0, max: 100, default: 0 },
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      completeness: { type: Number, min: 0, max: 100, default: 0 },
      overallScore: { type: Number, min: 0, max: 100, default: 0 },
    },

    feedback: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      improvementAreas: { type: [String], default: [] },
    },

    // Session lifecycle
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'completed', 'abandoned'],
      default: 'draft',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
