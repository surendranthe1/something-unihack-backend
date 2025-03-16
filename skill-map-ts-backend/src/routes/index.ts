// src/routes/index.ts
import { Router } from 'express';
import skillMapRoutes from './skillMapRoutes';
import userProgressRoutes from './userProgressRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register routes
router.use('/skill-maps', skillMapRoutes);
router.use('/progress', userProgressRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;