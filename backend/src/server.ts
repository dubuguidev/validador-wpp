import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import {
  initialize as initWhatsApp,
  disconnect as disconnectWhatsApp,
} from './services/whatsapp.service';
import { cleanupOldJobs } from './services/job.service';

// ─── Inicia o servidor HTTP ───────────────────────────────────────────────────

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Backend rodando em http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`🔒 CORS habilitado para: ${env.CORS_ORIGIN}`);
});

// ─── Inicializa serviço WhatsApp (assíncrono) ─────────────────────────────────

initWhatsApp().catch((err) => {
  logger.error({ err }, 'Erro crítico ao iniciar WhatsApp service');
});

// ─── Limpeza periódica de jobs antigos ───────────────────────────────────────

// Remove jobs mais velhos que 24h a cada 6 horas para evitar vazamento de memória
setInterval(() => {
  cleanupOldJobs();
}, 6 * 60 * 60 * 1000);

// ─── Shutdown Gracioso ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Sinal de encerramento recebido. Encerrando servidor...');

  server.close(async () => {
    await disconnectWhatsApp();
    logger.info('Servidor encerrado com sucesso.');
    process.exit(0);
  });

  // Forçar encerramento após 10 segundos se algo travar
  setTimeout(() => {
    logger.warn('Encerramento forçado após timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Tratamento de Erros Não Capturados ──────────────────────────────────────

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Exceção não capturada — mantendo servidor no ar');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Promise rejeitada sem tratamento — mantendo servidor no ar');
});
