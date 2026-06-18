import { Router, Request, Response, NextFunction } from 'express';
import { getTopSHAPFeatures } from '../services/shapService';
import { sendSuccess } from '../middleware/errorHandler';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = getTopSHAPFeatures(20);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
});

export default router;
