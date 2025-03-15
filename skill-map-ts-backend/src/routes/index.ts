// src/routes/index.ts
import { Router } from 'express';
import skillMapRoutes from './skillMapRoutes';
import skillProgramRoutes from './skillProgramRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register routes
router.use('/skill-maps', skillMapRoutes);
router.use('/skill-programs', skillProgramRoutes);

export default router;