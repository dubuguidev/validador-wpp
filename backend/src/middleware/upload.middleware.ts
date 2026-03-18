import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

/** Garante que o diretório de uploads existe antes de salvar um arquivo */
const ensureUploadDir = () => {
  if (!fs.existsSync(env.UPLOAD_DIR)) {
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  }
};

/**
 * Armazena os arquivos em disco com nome único baseado em timestamp.
 * Evita colisões quando múltiplos uploads ocorrem simultaneamente.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Prefixo com timestamp + nome original para rastreabilidade
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    cb(null, uniqueName);
  },
});

/**
 * Valida extensão e tipo MIME do arquivo enviado.
 * Rejeita qualquer coisa que não seja .xlsx ou .xls para prevenir uploads maliciosos.
 */
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Apenas arquivos Excel (.xlsx, .xls) são aceitos.'));
  }

  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/octet-stream', // fallback de alguns clientes
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Tipo MIME inválido. Por favor, envie um arquivo Excel válido.'));
  }

  cb(null, true);
};

/** Instância multer configurada para upload de Excel — máx. 10 MB, 1 arquivo por vez */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});
