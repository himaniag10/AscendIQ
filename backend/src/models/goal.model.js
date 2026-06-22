import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['weekly_interviews', 'monthly_interviews', 'target_score'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 1,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
    },
    deadline: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to automatically check if goal is completed
goalSchema.methods.checkCompletion = async function () {
  if (this.status !== 'in_progress') return;

  if (this.currentValue >= this.targetValue) {
    this.status = 'completed';
    await this.save();
  } else if (this.deadline < new Date()) {
    this.status = 'failed';
    await this.save();
  }
};

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
