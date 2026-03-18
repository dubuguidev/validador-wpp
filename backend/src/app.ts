import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import whatsappRoutes from './routes/whatsapp.routes';
import uploadRoutes from './routes/upload.routes';
import jobRoutes from './routes/job.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// ─── Segurança ────────────────────────────────────────────────────────────────

// helmet define headers HTTP seguros (X-Frame-Options, CSP, etc.)
app.use(helmet());

// CORS restrito à origin do frontend configurada em .env
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);

// ─── Parsing ──────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────

/** Endpoint simples para verificar se o servidor está rodando */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rotas da API ─────────────────────────────────────────────────────────────

app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

// ─── Handler Global de Erros ──────────────────────────────────────────────────

// Deve ser o último middleware registrado
app.use(errorMiddleware);

export default app;
