import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from 'jet-logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Erreur de validation Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.issues
    });
  }

  // Erreur Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Key Error',
      message: 'Une ressource avec cette référence existe déjà.',
      details: err.keyValue
    });
  }

  // Log de l'erreur pour le debug
  logger.err(err, true);

  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
