import { Router, Request, Response, NextFunction } from 'express';
import { getJob } from '../services/job.service';
import { generateExcel, generateCSV } from '../services/excel.service';
import { NumberResult } from '../types';

const router = Router();

// ─── Utilitário ───────────────────────────────────────────────────────────────

/** Divide os resultados de um job em listas de válidos e inválidos */
function splitResults(results: NumberResult[]) {
  return {
    valid: results.filter((r) => r.exists),
    invalid: results.filter((r) => !r.exists),
  };
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

/**
 * GET /api/jobs/:id/status
 *
 * Retorna o progresso atual do job.
 * Resposta: { jobId, status, progress, total, error? }
 */
router.get('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const job = getJob(jobId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job não encontrado.' });
      return;
    }

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        total: job.total,
        error: job.error,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/:id/results
 *
 * Retorna os resultados completos do job (disponíveis durante e após processamento).
 * Resposta: { jobId, valid: [], invalid: [], total }
 */
router.get('/:id/results', (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const job = getJob(jobId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job não encontrado.' });
      return;
    }

    if (job.status === 'pending') {
      res.status(400).json({ success: false, error: 'O job ainda não iniciou o processamento.' });
      return;
    }

    const { valid, invalid } = splitResults(job.results);

    res.json({
      success: true,
      data: { jobId: job.id, valid, invalid, total: job.total },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/:id/download?format=xlsx|csv
 *
 * Gera e retorna o arquivo de relatório para download.
 * Disponível apenas quando o job está com status "completed".
 * - format=xlsx (padrão): arquivo Excel com múltiplas abas
 * - format=csv: CSV com BOM UTF-8 para compatibilidade com Excel no Windows
 */
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const job = getJob(jobId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job não encontrado.' });
      return;
    }

    if (job.status !== 'completed') {
      res.status(400).json({
        success: false,
        error: `Job ainda não concluído. Status atual: ${job.status}.`,
      });
      return;
    }

    const format = (req.query.format as string | undefined)?.toLowerCase() ?? 'xlsx';
    const { valid, invalid } = splitResults(job.results);
    const safeJobId = job.id.slice(0, 8); // Usa apenas os primeiros 8 chars do UUID no nome

    if (format === 'csv') {
      const csv = generateCSV(valid, invalid);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="whatsapp-resultado-${safeJobId}.csv"`,
      );
      res.send(csv);
      return;
    }

    // Padrão: Excel (.xlsx)
    const buffer = await generateExcel(valid, invalid);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="whatsapp-resultado-${safeJobId}.xlsx"`,
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
