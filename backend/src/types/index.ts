// ─── Status do Job ────────────────────────────────────────────────────────────

/** Estados possíveis de um job de validação */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Resultado da verificação de um número individual */
export interface NumberResult {
  phone: string;    // Número original extraído do Excel
  exists: boolean;  // true = existe no WhatsApp
  error?: string;   // Mensagem de erro, se a consulta falhou
}

/** Registro completo de um job armazenado em memória */
export interface Job {
  id: string;
  status: JobStatus;
  total: number;           // Total de números a validar
  progress: number;        // Quantidade já verificada
  results: NumberResult[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;          // Erro de nível de job (ex: WhatsApp desconectado)
}

// ─── Status do WhatsApp ───────────────────────────────────────────────────────

/** Estado atual da conexão WhatsApp */
export interface WhatsAppStatus {
  connected: boolean;
  qr?: string; // Data URL base64 (data:image/png;base64,...) para exibir o QR
}

// ─── Tipos de Resposta da API ─────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  total: number;
  error?: string;
}

export interface JobResultsResponse {
  jobId: string;
  valid: NumberResult[];
  invalid: NumberResult[];
  total: number;
}

export interface UploadResponse {
  jobId: string;
  total: number;
}
