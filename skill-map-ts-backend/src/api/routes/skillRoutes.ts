// src/api/routes/skillRoutes.ts
import express from 'express';
import skillController from '../controllers/skillController';
import { validationMiddleware } from '../../middlewares/validationMiddleware';
import { SkillMapRequestSchema } from '../models/skillMap';

const router = express.Router();

/**
 * Generate a new skill map
 */
router.post(
  '/generate', 
  validationMiddleware(SkillMapRequestSchema),
  skillController.generateSkillMap
);

/**
 * Get a specific skill map
 */
router.get(
  '/:skillMapId', 
  skillController.getSkillMap
);

/**
 * Get all skill maps for a user
 */
router.get(
  '/user/:userId', 
  skillController.getUserSkillMaps
);

/**
 * Delete a skill map
 */
router.delete(
  '/:skillMapId', 
  skillController.deleteSkillMap
);

export default router;