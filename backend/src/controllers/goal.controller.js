import Goal from '../models/goal.model.js';

/**
 * GET /api/goals
 * Get all goals for the logged-in user.
 */
export async function getGoals(req, res, next) {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    // Auto-check completion
    for (let goal of goals) {
      await goal.checkCompletion();
    }

    res.status(200).json({ success: true, goals });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/goals
 * Create a new goal.
 */
export async function createGoal(req, res, next) {
  try {
    const { title, type, targetValue, deadline } = req.body;

    if (!title || !type || !targetValue || !deadline) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const goal = await Goal.create({
      user: req.user._id,
      title,
      type,
      targetValue,
      deadline: new Date(deadline),
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/goals/:id
 * Delete a goal.
 */
export async function deleteGoal(req, res, next) {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    res.status(200).json({ success: true, message: 'Goal deleted successfully' });
  } catch (err) {
    next(err);
  }
}
