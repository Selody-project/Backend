import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line max-len, no-unused-vars
const apiError = (error: any, req: Request, res: Response, next: NextFunction): Response => res.status(error.status).json({ error: error.message });

export default apiError;
