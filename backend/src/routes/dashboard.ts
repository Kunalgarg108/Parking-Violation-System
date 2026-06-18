import { Router, Request, Response, NextFunction } from 'express';
import { computeKPIs } from '../services/dashboardService';
import { sendSuccess } from '../middleware/errorHandler';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = computeKPIs();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

export default router;
