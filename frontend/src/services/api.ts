import axios from 'axios';
import type {
  ApiResponse,
  WhatsAppStatus,
  JobStatusResponse,
  JobResultsResponse,
  UploadResponse,
} from '../types';

/**
 * Instância axios configurada.
 * O proxy do Vite redireciona /api → http://localhost:3001/api em desenvolvimento.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/** Retorna o estado atual da conexão WhatsApp (connected, qr?) */
export async function fetchWhatsAppStatus(): Promise<WhatsAppStatus> {
  const { data } = await api.get<ApiResponse<WhatsAppStatus>>('/whatsapp/status');
  if (!data.success || !data.data) throw new Error(data.error ?? 'Erro ao buscar status');
  return data.data;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Envia um arquivo Excel para o backend.
 * Retorna o jobId e o total de números encontrados.
 *
 * @param file - Arquivo .xlsx ou .xls selecionado pelo usuário
 * @param onProgress - Callback com percentual de upload (0–100)
 */
export async function uploadExcel(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ApiResponse<UploadResponse>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });

  if (!data.success || !data.data) throw new Error(data.error ?? 'Erro no upload');
  return data.data;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/** Retorna o status atual de um job (progresso, status) */
export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const { data } = await api.get<ApiResponse<JobStatusResponse>>(`/jobs/${jobId}/status`);
  if (!data.success || !data.data) throw new Error(data.error ?? 'Erro ao buscar status do job');
  return data.data;
}

/** Retorna os resultados completos de um job */
export async function fetchJobResults(jobId: string): Promise<JobResultsResponse> {
  const { data } = await api.get<ApiResponse<JobResultsResponse>>(`/jobs/${jobId}/results`);
  if (!data.success || !data.data) throw new Error(data.error ?? 'Erro ao buscar resultados');
  return data.data;
}

/**
 * Dispara o download do relatório do job.
 * Cria um link temporário no DOM e clica nele para iniciar o download do navegador.
 *
 * @param jobId - ID do job concluído
 * @param format - 'xlsx' (padrão) ou 'csv'
 */
export function downloadReport(jobId: string, format: 'xlsx' | 'csv' = 'xlsx'): void {
  const url = `/api/jobs/${jobId}/download?format=${format}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `whatsapp-resultado.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
