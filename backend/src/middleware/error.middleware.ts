import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Handler global de erros do Express.
 * Deve ter exatamente 4 parâmetros para ser reconhecido como error handler pelo Express.
 *
 * Captura erros de qualquer rota/middleware e retorna resposta JSON padronizada.
 */
export const errorMiddleware = (
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Erro interno do servidor.';

  // Log completo do erro (omitindo dados sensíveis em produção)
  logger.error(
    { err, path: req.path, method: req.method, status },
    'Erro na requisição',
  );

  res.status(status).json({
    success: false,
    error: message,
    // Stack trace apenas em desenvolvimento para facilitar debugging
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
