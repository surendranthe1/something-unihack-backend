// src/routes/userProgressRoutes.ts
import { Router } from 'express';
import {
  initializeProgress,
  getProgress,
  updateSkillProgress,
  getDashboardData
} from '../controllers/userProgressController';

const router = Router();

// Initialize progress tracking
router.post('/:userId/skill-maps/:skillMapId', initializeProgress);

// Get progress for a skill map
router.get('/:userId/skill-maps/:skillMapId', getProgress);

// Update skill node progress
router.patch(
  '/:userId/skill-maps/:skillMapId/nodes/:nodeId',
  updateSkillProgress
);

// Get dashboard data
router.get('/:userId/dashboard', getDashboardData);

export default router;