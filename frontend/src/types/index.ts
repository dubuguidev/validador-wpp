// ─── Tipos espelhando o backend ───────────────────────────────────────────────
// Mantidos em sincronia com backend/src/types/index.ts

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface NumberResult {
  phone: string;
  exists: boolean;
  error?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  total: number;
  progress: number;
  results: NumberResult[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface WhatsAppStatus {
  connected: boolean;
  qr?: string; // data URL base64 da imagem do QR code
}

// ─── Respostas da API ─────────────────────────────────────────────────────────

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

// ─── Estado da Aplicação ──────────────────────────────────────────────────────

/** Etapas do fluxo principal da aplicação */
export type AppStep = 'qr' | 'upload' | 'processing' | 'results';
