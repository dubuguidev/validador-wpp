import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/** Todas as variáveis de ambiente usadas pela aplicação, com valores padrão segurs */
export const env = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  // Origin do frontend permitido pelo CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Diretório para armazenar arquivos Excel enviados (temporário)
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? 'uploads',
  // Diretório onde o Baileys salva as credenciais de sessão WhatsApp
  AUTH_SESSION_DIR: process.env.AUTH_SESSION_DIR ?? 'auth_sessions',
  // Delay (ms) entre cada consulta onWhatsApp — evita ban
  CHECK_DELAY_MS: parseInt(process.env.CHECK_DELAY_MS ?? '1500', 10),
  // Tamanho do lote antes de uma pausa maior
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE ?? '20', 10),
  // Pausa (ms) após cada lote de BATCH_SIZE números
  BATCH_PAUSE_MS: parseInt(process.env.BATCH_PAUSE_MS ?? '15000', 10),
} as const;
