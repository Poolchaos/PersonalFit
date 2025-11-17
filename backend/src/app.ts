import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import workoutRoutes from './routes/workoutRoutes';
import sessionRoutes from './routes/sessionRoutes';
import progressRoutes from './routes/progressRoutes';
import metricsRoutes from './routes/metricsRoutes';
import aiConfigRoutes from './routes/aiConfigRoutes';
import accountabilityRoutes from './routes/accountabilityRoutes';
import adminRoutes from './routes/adminRoutes';
import photoRoutes from './routes/photoRoutes';

const app: Application = express();

// Middleware
app.use(cors({
  origin: config.cors_origin.split(',').map(origin => origin.trim()),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/ai-config', aiConfigRoutes);
app.use('/api/accountability', accountabilityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/photos', photoRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Multer error handler (must come before general error handler)
app.use((err: Error & { code?: string }, _req: Request, res: Response, next: NextFunction) => {
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File size exceeds 10MB limit' });
    return;
  }
  if (err.code && err.code.startsWith('LIMIT_')) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message && err.message.includes('Invalid file type')) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
