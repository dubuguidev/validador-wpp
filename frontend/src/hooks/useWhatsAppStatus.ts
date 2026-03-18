import { useState, useEffect, useRef } from 'react';
import { fetchWhatsAppStatus } from '../services/api';
import type { WhatsAppStatus } from '../types';

/**
 * Hook que faz polling do status de conexão WhatsApp a cada 2 segundos.
 *
 * Retorna:
 * - status: { connected, qr? } — undefined enquanto carrega
 * - error: mensagem de erro, se houver
 * - loading: true na primeira chamada
 */
export function useWhatsAppStatus() {
  const [status, setStatus] = useState<WhatsAppStatus | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = async () => {
    try {
      const result = await fetchWhatsAppStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar status do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Primeira consulta imediata
    poll();

    // Polling a cada 2 segundos
    intervalRef.current = setInterval(poll, 2000);

    // Cleanup: para o polling ao desmontar o componente
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { status, error, loading };
}
