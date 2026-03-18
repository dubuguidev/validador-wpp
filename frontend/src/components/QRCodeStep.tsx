import type { WhatsAppStatus } from '../types';

interface QRCodeStepProps {
  status: WhatsAppStatus | undefined;
  loading: boolean;
  error: string | null;
}

/**
 * Etapa 1: Exibe o QR code para autenticação no WhatsApp.
 *
 * - Enquanto o backend gera o QR: mostra spinner de carregamento
 * - Com QR disponível: exibe a imagem para escaneamento
 * - Após conexão: este componente não é mais exibido pelo App
 */
export function QRCodeStep({ status, loading, error }: QRCodeStepProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Ícone WhatsApp */}
      <div className="w-16 h-16 rounded-full bg-whatsapp-green flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Conectar ao WhatsApp</h2>
        <p className="mt-2 text-gray-500 max-w-sm">
          Escaneie o QR code com seu WhatsApp para autorizar as consultas de validação.
        </p>
      </div>

      {/* Área do QR Code */}
      <div className="relative">
        {loading && !status?.qr && (
          <div className="w-64 h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-gray-50">
            <div className="w-10 h-10 border-4 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Aguardando QR code...</p>
          </div>
        )}

        {!loading && !status?.qr && !status?.connected && (
          <div className="w-64 h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-gray-50">
            <div className="w-10 h-10 border-4 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Gerando QR code...</p>
          </div>
        )}

        {status?.qr && (
          <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-md">
            <img
              src={status.qr}
              alt="QR Code WhatsApp — escaneie com o aplicativo"
              className="w-56 h-56 object-contain"
            />
          </div>
        )}
      </div>

      {/* Instruções */}
      {status?.qr && (
        <ol className="text-sm text-gray-500 list-decimal list-inside space-y-1 max-w-xs text-left">
          <li>Abra o WhatsApp no seu celular</li>
          <li>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
          <li>Selecione <strong>Aparelhos conectados</strong></li>
          <li>Aponte a câmera para este QR code</li>
        </ol>
      )}

      {/* Erro de conexão */}
      {error && (
        <div className="w-full max-w-sm p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
