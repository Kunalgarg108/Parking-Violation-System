import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { initializeCache, dataCache } from './services/csvLoader';
import { globalErrorHandler } from './middleware/errorHandler';

import dashboardRouter from './routes/dashboard';
import zonesRouter from './routes/zones';
import patrolRouter from './routes/patrol';
import analyticsRouter from './routes/analytics';
import repeatOffendersRouter from './routes/repeatOffenders';
import shapRouter from './routes/shap';

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Load CSV data into memory on startup
// ---------------------------------------------------------------------------
initializeCache();

// ---------------------------------------------------------------------------
// Health endpoint – always available (bypasses service availability check)
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'success', data: { message: 'Parking Intelligence API is running' } });
});

// ---------------------------------------------------------------------------
// Service availability middleware – returns 503 if CSV loading failed
// ---------------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  if (dataCache.status === 'error') {
    return res.status(503).json({
      status: 'error',
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: `Data loading failed: ${dataCache.errors.join('; ')}`,
      },
    });
  }
  next();
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/dashboard', dashboardRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/patrol', patrolRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/shap', shapRouter);
app.use('/api/repeat-offenders', repeatOffendersRouter);

// ---------------------------------------------------------------------------
// Global error handler (must be last middleware)
// ---------------------------------------------------------------------------
app.use(globalErrorHandler);

// ---------------------------------------------------------------------------
// Start server only when run directly
// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
}

export default app;
