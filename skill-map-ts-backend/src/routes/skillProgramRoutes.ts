// src/routes/skillProgramRoutes.ts
import { Router } from 'express';
import * as skillProgramController from '../controllers/skillProgramController';
import { validate } from '../middleware/validation';
import { SkillProgramRequestSchema, ProgressUpdateRequestSchema } from '../models/dto/SkillProgramDto';
import { z } from 'zod';

const router = Router();

// Search query schema
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform(val => 
    val ? parseInt(val, 10) : undefined
  ),
});

/**
 * @route   POST /api/skill-programs
 * @desc    Generate a new 30-day skill program
 * @access  Public
 */
router.post(
  '/',
  validate(SkillProgramRequestSchema),
  skillProgramController.generateSkillProgram
);

/**
 * @route   POST /api/skill-programs/progress
 * @desc    Update progress for daily tasks
 * @access  Public
 */
router.post(
  '/progress',
  validate(ProgressUpdateRequestSchema),
  skillProgramController.updateTaskProgress
);

/**
 * @route   GET /api/skill-programs/search
 * @desc    Search skill programs
 * @access  Public
 * NOTE: This route must come BEFORE the :id route to prevent conflicts
 */
router.get(
  '/search',
  validate(SearchQuerySchema, 'query'),
  skillProgramController.searchSkillPrograms
);

/**
 * @route   GET /api/skill-programs/user/:userId
 * @desc    Get skill programs for a user
 * @access  Public
 */
router.get(
  '/user/:userId',
  skillProgramController.getSkillProgramsByUserId
);

/**
 * @route   GET /api/skill-programs/:id
 * @desc    Get a skill program by ID
 * @access  Public
 */
router.get(
  '/:id',
  skillProgramController.getSkillProgramById
);

/**
 * @route   DELETE /api/skill-programs/:id
 * @desc    Delete a skill program
 * @access  Public
 */
router.delete(
  '/:id',
  skillProgramController.deleteSkillProgram
);

export default router;