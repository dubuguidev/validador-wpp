import pino from 'pino';
import { env } from './env';

/**
 * Logger centralizado usando Pino.
 * Em desenvolvimento: saída colorida formatada (pino-pretty).
 * Em produção: JSON estruturado puro para coleta por sistemas como Datadog/Loki.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
