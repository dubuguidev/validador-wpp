import { useState } from 'react';
import { downloadReport } from '../services/api';

interface DownloadButtonsProps {
  jobId: string;
  onNewValidation: () => void;
}

/**
 * Etapa 4 (parte 2): Botões para baixar o relatório e iniciar nova validação.
 *
 * - Download em formato Excel (.xlsx) com múltiplas abas
 * - Download em formato CSV para uso em outras ferramentas
 * - Botão para recomeçar
 */
export function DownloadButtons({ jobId, onNewValidation }: DownloadButtonsProps) {
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    const setLoading = format === 'xlsx' ? setDownloadingXlsx : setDownloadingCsv;

    setLoading(true);
    setFeedback(null);

    try {
      downloadReport(jobId, format);
      setFeedback(`Relatório ${format.toUpperCase()} baixado com sucesso!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Erro ao baixar arquivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        Baixar Relatório
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Download Excel */}
        <button
          onClick={() => handleDownload('xlsx')}
          disabled={downloadingXlsx}
          className="
            flex items-center justify-center gap-2 py-3 px-4
            bg-whatsapp-green text-white rounded-xl font-medium text-sm
            hover:bg-whatsapp-dark transition-all duration-200
            active:scale-[0.98] shadow-md hover:shadow-lg
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {downloadingXlsx ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h2.5l-2.5-3h2l1.5 2 1.5-2h2l-2.5 3H15v1.5H8V15z" />
            </svg>
          )}
          Excel (.xlsx)
        </button>

        {/* Download CSV */}
        <button
          onClick={() => handleDownload('csv')}
          disabled={downloadingCsv}
          className="
            flex items-center justify-center gap-2 py-3 px-4
            bg-white text-gray-700 border border-gray-300 rounded-xl font-medium text-sm
            hover:bg-gray-50 hover:border-gray-400 transition-all duration-200
            active:scale-[0.98] shadow-sm hover:shadow-md
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {downloadingCsv ? (
            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-600">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM10 13H8v1.5h2V13zm0 3H8v1.5h2V16zm4-3h-2v1.5h2V13zm0 3h-2v1.5h2V16z" />
            </svg>
          )}
          CSV (.csv)
        </button>
      </div>

      {/* Feedback de download */}
      {feedback && (
        <div
          className={`
            text-center text-sm py-2 px-3 rounded-lg
            ${feedback.includes('Erro') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
          `}
        >
          {feedback}
        </div>
      )}

      {/* Separador e botão de nova validação */}
      <div className="pt-2 border-t border-gray-100">
        <button
          onClick={onNewValidation}
          className="
            w-full py-2.5 px-4 text-sm font-medium text-gray-500
            hover:text-whatsapp-green hover:bg-green-50
            rounded-xl transition-all duration-200
          "
        >
          ↩ Validar outro arquivo
        </button>
      </div>
    </div>
  );
}
