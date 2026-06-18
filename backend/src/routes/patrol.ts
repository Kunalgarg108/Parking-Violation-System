import { Router, Request, Response, NextFunction } from 'express';
import { validateUnitCount, assignPatrols } from '../services/patrolService';
import { AppError, sendSuccess } from '../middleware/errorHandler';
import { validateRequired } from '../middleware/validation';

const router = Router();

router.get('/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { units } = req.query;

    validateRequired(units, 'units');

    let unitCount: number;
    try {
      unitCount = validateUnitCount(units);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid units parameter';
      throw new AppError(400, 'INVALID_PARAMETER', message);
    }

    const result = assignPatrols(unitCount);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
