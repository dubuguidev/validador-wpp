import { Router, Request, Response } from 'express';
import { getStatus } from '../services/whatsapp.service';

const router = Router();

/**
 * GET /api/whatsapp/status
 *
 * Retorna o estado atual da conexão WhatsApp:
 * - { connected: false, qr: "data:image/png;base64,..." } — aguardando escaneamento
 * - { connected: true }                                    — autenticado e pronto
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = getStatus();
  res.json({ success: true, data: status });
});

export default router;
