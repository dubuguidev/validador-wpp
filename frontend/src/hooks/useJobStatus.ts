import { useState, useEffect, useRef } from 'react';
import { fetchJobStatus } from '../services/api';
import type { JobStatusResponse } from '../types';

/**
 * Hook que faz polling do status de um job específico a cada 2 segundos.
 * Para automaticamente quando o job termina (completed ou failed).
 *
 * @param jobId - ID do job retornado pelo endpoint de upload (null para desativar)
 *
 * Retorna:
 * - jobStatus: dados atuais de progresso
 * - error: mensagem de erro, se houver
 */
export function useJobStatus(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const result = await fetchJobStatus(jobId);
        setJobStatus(result);
        setError(null);

        // Para o polling quando o job terminar
        if (result.status === 'completed' || result.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar status do job');
      }
    };

    // Primeira consulta imediata
    poll();

    // Polling a cada 2 segundos
    intervalRef.current = setInterval(poll, 2000);

    // Cleanup: para o polling ao trocar de job ou desmontar
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return { jobStatus, error };
}
