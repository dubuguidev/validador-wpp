import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../middleware/upload.middleware';
import { parseExcel } from '../services/excel.service';
import { createJob } from '../services/job.service';
import { getStatus } from '../services/whatsapp.service';
import { logger } from '../config/logger';

const router = Router();

/** Máximo de números aceitos por arquivo para evitar abuso */
const MAX_NUMBERS = 1000;

/**
 * POST /api/upload
 *
 * Recebe um arquivo Excel via multipart/form-data (campo "file"),
 * extrai os números de telefone da coluna A e cria um job de validação assíncrono.
 *
 * Resposta 202 Accepted com { jobId, total } para acompanhamento do progresso.
 */
router.post(
  '/',
  // Passo 1: Processa o upload com multer (tratamento de erro inline)
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const error = err instanceof Error ? err : new Error('Erro no upload do arquivo');
        return next(Object.assign(error, { status: 400 }));
      }
      next();
    });
  },
  // Passo 2: Valida pré-condições e cria o job
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verifica se o WhatsApp está conectado antes de criar o job
      const waStatus = getStatus();
      if (!waStatus.connected) {
        res.status(400).json({
          success: false,
          error: 'WhatsApp não está conectado. Escaneie o QR code primeiro.',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, error: 'Nenhum arquivo foi enviado.' });
        return;
      }

      // Extrai os números do Excel
      const phones = await parseExcel(req.file.path);

      if (phones.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Nenhum número de telefone encontrado no arquivo. Verifique se os números estão na coluna A.',
        });
        return;
      }

      if (phones.length > MAX_NUMBERS) {
        res.status(400).json({
          success: false,
          error: `Máximo de ${MAX_NUMBERS} números por arquivo. O arquivo enviado contém ${phones.length} números.`,
        });
        return;
      }

      // Cria job assíncrono — retorna imediatamente sem aguardar processamento
      const jobId = createJob(phones, req.file.path);

      logger.info({ jobId, count: phones.length }, 'Upload aceito — job criado');

      // 202 Accepted: processamento em andamento
      res.status(202).json({
        success: true,
        data: { jobId, total: phones.length },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
