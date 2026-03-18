import type { JobStatusResponse } from '../types';

interface ProcessingStatusProps {
  jobStatus: JobStatusResponse | null;
  error: string | null;
}

/**
 * Etapa 3: Exibe o progresso da validação em tempo real.
 *
 * - Barra de progresso animada
 * - Contador de números processados
 * - Mensagem de status contextual
 * - Alerta se o job falhar
 */
export function ProcessingStatus({ jobStatus, error }: ProcessingStatusProps) {
  const progress = jobStatus?.progress ?? 0;
  const total = jobStatus?.total ?? 0;
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
  const status = jobStatus?.status ?? 'pending';

  // Estimativa de tempo restante (baseada no delay de 1.5s por número + pausas)
  const remaining = total - progress;
  const estimatedSeconds = remaining * 1.5;
  const estimatedMin = Math.ceil(estimatedSeconds / 60);

  const statusLabels: Record<string, string> = {
    pending: 'Aguardando início...',
    processing: `Verificando números no WhatsApp...`,
    completed: 'Validação concluída!',
    failed: 'Falha na validação',
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 w-full max-w-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Validando Números</h2>
        <p className="mt-2 text-gray-500">
          Consultando cada número no WhatsApp. Não feche esta janela.
        </p>
      </div>

      {/* Ícone animado */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-whatsapp-green">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        {status === 'processing' && (
          <div className="absolute inset-0 rounded-full border-4 border-whatsapp-green border-t-transparent animate-spin" />
        )}
      </div>

      {/* Card de progresso */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Contadores */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">{statusLabels[status]}</span>
          <span className="text-sm font-bold text-gray-800">
            {progress} <span className="text-gray-400 font-normal">/ {total}</span>
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(90deg, #25D366, #128C7E)`,
            }}
          />
        </div>

        {/* Percentual */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>{percent}% concluído</span>
          {status === 'processing' && remaining > 0 && (
            <span>~{estimatedMin} min restante{estimatedMin !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Aviso de rate limiting */}
      {status === 'processing' && (
        <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 text-center">
          ⏱️ O processo usa delays entre consultas para respeitar os limites do WhatsApp e evitar bloqueios.
        </div>
      )}

      {/* Erro do job */}
      {(error || jobStatus?.error) && (
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          ⚠️ {jobStatus?.error ?? error}
        </div>
      )}
    </div>
  );
}
