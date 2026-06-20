import mongoose from 'mongoose';

const interviewMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },

    // 'ai' = interviewer message, 'candidate' = candidate answer
    role: {
      type: String,
      enum: ['ai', 'candidate'],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    // Turn number in the conversation (1-indexed)
    sequenceNumber: {
      type: Number,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const InterviewMessage = mongoose.model('InterviewMessage', interviewMessageSchema);

export default InterviewMessage;
