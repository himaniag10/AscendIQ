import express from 'express';
import { getGoals, createGoal, deleteGoal } from '../controllers/goal.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .delete(deleteGoal);

export default router;
