import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadExcel } from '../services/api';

interface FileUploadProps {
  onJobCreated: (jobId: string, total: number) => void;
}

/**
 * Etapa 2: Permite ao usuário selecionar e enviar o arquivo Excel.
 *
 * - Aceita .xlsx e .xls via drag-and-drop ou clique
 * - Exibe feedback de progresso de upload
 * - Valida o arquivo antes de enviar
 */
export function FileUpload({ onJobCreated }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null);

    if ((rejectedFiles as Array<unknown>).length > 0) {
      setError('Arquivo inválido. Envie apenas arquivos Excel (.xlsx ou .xls).');
      return;
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadExcel(selectedFile, setUploadProgress);
      onJobCreated(result.jobId, result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo. Tente novamente.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          <span className="text-whatsapp-green">✓</span> WhatsApp Conectado
        </h2>
        <p className="mt-2 text-gray-500">
          Envie seu arquivo Excel com os números para validar (coluna A) <br />
          Exemplo do arquivo: NÚMERO - NOME
        </p>
      </div>

      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={`
          w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
          flex flex-col items-center gap-3 text-center
          ${isDragActive
            ? 'border-whatsapp-green bg-green-50 scale-[1.02]'
            : 'border-gray-300 bg-gray-50 hover:border-whatsapp-green hover:bg-green-50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Ícone Excel */}
        <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-green-600">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            <path d="M8 13.5l1.5 2.5L8 18.5h1.5l.75-1.5.75 1.5H12.5l-1.5-2.5 1.5-2.5H11l-.75 1.5L9.5 13.5H8zm4.5 0v5H14v-1.5h1v-1H14v-1h1v-1h-2.5z" />
          </svg>
        </div>

        {isDragActive ? (
          <p className="text-whatsapp-green font-medium">Solte o arquivo aqui...</p>
        ) : (
          <>
            <p className="font-medium text-gray-700">
              Arraste e solte seu arquivo Excel aqui
            </p>
            <p className="text-sm text-gray-400">ou clique para selecionar</p>
            <p className="text-xs text-gray-400">
              Aceito: .xlsx, .xls — Máximo: 10 MB — Números na coluna A
            </p>
          </>
        )}
      </div>

      {/* Arquivo selecionado */}
      {selectedFile && !uploading && (
        <div className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-600 text-sm font-bold">XLS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-red-400 transition-colors p-1"
            aria-label="Remover arquivo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de progresso do upload */}
      {uploading && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Enviando arquivo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-whatsapp-green rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Botão de envio */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200
          ${selectedFile && !uploading
            ? 'bg-whatsapp-green hover:bg-whatsapp-dark active:scale-[0.98] shadow-md hover:shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
          }
        `}
      >
        {uploading ? 'Enviando...' : 'Valide Agora'}
      </button>
    </div>
  );
}
