import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Job, NumberResult } from '../types';
import { checkNumber } from './whatsapp.service';
import { logger } from '../config/logger';
import { env } from '../config/env';

// ─── Store em Memória ─────────────────────────────────────────────────────────

/**
 * Mapa de jobs em memória.
 * Adequado para instância única. Para multi-instância em produção, substitua por Redis.
 */
const jobs = new Map<string, Job>();

// ─── Utilitário ───────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Cria um novo job de validação e inicia o processamento assíncrono.
 * Retorna imediatamente com o ID do job (não-bloqueante).
 *
 * @param phones - Array de números de telefone normalizados
 * @param uploadedFilePath - Caminho do arquivo temporário para limpeza posterior
 * @returns jobId (UUID)
 */
export function createJob(phones: string[], uploadedFilePath: string): string {
  const jobId = uuidv4();

  const job: Job = {
    id: jobId,
    status: 'pending',
    total: phones.length,
    progress: 0,
    results: [],
    createdAt: new Date(),
  };

  jobs.set(jobId, job);
  logger.info({ jobId, total: phones.length }, 'Job de validação criado');

  // Inicia processamento em background (não bloqueia a resposta HTTP)
  processJob(jobId, phones, uploadedFilePath).catch((err) => {
    logger.error({ err, jobId }, 'Erro fatal durante processamento do job');
    const j = jobs.get(jobId);
    if (j) {
      j.status = 'failed';
      j.error = err instanceof Error ? err.message : 'Erro desconhecido';
    }
  });

  return jobId;
}

/** Retorna o job pelo ID, ou undefined se não encontrado */
export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

/**
 * Remove jobs antigos da memória para evitar vazamento.
 * Deve ser chamado periodicamente (ex: a cada 6 horas).
 *
 * @param maxAgeMs - Idade máxima em ms (padrão: 24h)
 */
export function cleanupOldJobs(maxAgeMs = 24 * 60 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs;
  let removed = 0;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < cutoff) {
      jobs.delete(id);
      removed++;
    }
  }
  if (removed > 0) {
    logger.info({ removed }, 'Jobs antigos removidos da memória');
  }
}

// ─── Processamento Interno ───────────────────────────────────────────────────

/**
 * Processa todos os números de um job, consultando cada um no WhatsApp.
 *
 * Estratégia de rate limiting para evitar ban:
 * - CHECK_DELAY_MS entre cada consulta (padrão: 1500ms)
 * - Pausa de BATCH_PAUSE_MS a cada BATCH_SIZE números (padrão: 15s a cada 20)
 *
 * Para 100 números: ~3 min | Para 1000 números: ~38 min
 */
async function processJob(
  jobId: string,
  phones: string[],
  uploadedFilePath: string,
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} não encontrado no store`);

  job.status = 'processing';
  logger.info({ jobId, total: phones.length }, 'Iniciando processamento');

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i];

    try {
      const exists = await checkNumber(phone);
      const result: NumberResult = { phone, exists };
      job.results.push(result);
      logger.debug(
        { jobId, phone: `***${phone.slice(-4)}`, exists, progress: `${i + 1}/${phones.length}` },
        'Número verificado',
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      job.results.push({ phone, exists: false, error: errorMsg });
      logger.warn(
        { jobId, phone: `***${phone.slice(-4)}`, error: errorMsg },
        'Falha ao verificar número — marcado como não encontrado',
      );
    }

    job.progress = i + 1;

    // ── Rate Limiting ────────────────────────────────────────────────────────
    if (i < phones.length - 1) {
      // Delay entre consultas individuais
      await sleep(env.CHECK_DELAY_MS);
    }

    // Pausa maior após cada lote para reduzir risco de bloqueio
    if ((i + 1) % env.BATCH_SIZE === 0 && i + 1 < phones.length) {
      logger.info(
        { jobId, processed: i + 1, pauseMs: env.BATCH_PAUSE_MS },
        'Pausa entre lotes (rate limiting)',
      );
      await sleep(env.BATCH_PAUSE_MS);
    }
  }

  job.status = 'completed';
  job.completedAt = new Date();

  // Remove o arquivo temporário após processamento
  try {
    fs.unlinkSync(uploadedFilePath);
  } catch {
    // Ignora erros de limpeza — arquivo pode já ter sido removido
  }

  const validCount = job.results.filter((r) => r.exists).length;
  logger.info(
    { jobId, total: phones.length, valid: validCount, invalid: phones.length - validCount },
    'Job concluído com sucesso',
  );
}
