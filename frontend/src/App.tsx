import { useState, useEffect } from 'react';
import { QRCodeStep } from './components/QRCodeStep';
import { FileUpload } from './components/FileUpload';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsTable } from './components/ResultsTable';
import { DownloadButtons } from './components/DownloadButtons';
import { useWhatsAppStatus } from './hooks/useWhatsAppStatus';
import { useJobStatus } from './hooks/useJobStatus';
import { fetchJobResults } from './services/api';
import type { AppStep, JobResultsResponse } from './types';

const STEP_LABELS: Record<AppStep, string> = {
  qr: 'Conectar',
  upload: 'Upload',
  processing: 'Validando',
  results: 'Resultados',
};

const STEP_ORDER: AppStep[] = ['qr', 'upload', 'processing', 'results'];

export default function App() {
  const [step, setStep] = useState<AppStep>('qr');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<JobResultsResponse | null>(null);

  const { status: waStatus, loading: waLoading, error: waError } = useWhatsAppStatus();
  const isConnected = Boolean(waStatus?.connected);
  const effectiveStep: AppStep =
    step === 'qr' && isConnected
      ? 'upload'
      : step === 'upload' && !isConnected
        ? 'qr'
        : step;
  const { jobStatus, error: jobError } = useJobStatus(effectiveStep === 'processing' ? jobId : null);

  useEffect(() => {
    if (jobStatus?.status === 'completed' && effectiveStep === 'processing' && jobId) {
      fetchJobResults(jobId)
        .then((results) => { setJobResults(results); setStep('results'); })
        .catch(() => setStep('results'));
    }
  }, [jobStatus?.status, effectiveStep, jobId]);

  const handleJobCreated = (newJobId: string) => {
    setJobId(newJobId);
    setJobResults(null);
    setStep('processing');
  };

  const handleNewValidation = () => {
    setJobId(null);
    setJobResults(null);
    setStep(isConnected ? 'upload' : 'qr');
  };

  const currentStepIndex = STEP_ORDER.indexOf(effectiveStep);

  return (
    <div className="min-h-screen bg-whatsapp-bg flex flex-col">
      {/* Header */}
      <header className="bg-whatsapp-dark shadow-md">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">WhatsApp Validator</h1>
            <p className="text-white/60 text-xs">Validação em massa de números</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${waStatus?.connected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-white/70 text-xs">{waStatus?.connected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {STEP_ORDER.map((s, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCompleted ? 'bg-whatsapp-green text-white' : isCurrent ? 'bg-whatsapp-dark text-white ring-2 ring-whatsapp-green/30' : 'bg-gray-200 text-gray-400'}`}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${isCurrent ? 'text-whatsapp-dark' : isCompleted ? 'text-whatsapp-green' : 'text-gray-400'}`}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${i < currentStepIndex ? 'bg-whatsapp-green' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 md:p-8 h-fit">
          {effectiveStep === 'qr' && <QRCodeStep status={waStatus} loading={waLoading} error={waError} />}
          {effectiveStep === 'upload' && <FileUpload onJobCreated={handleJobCreated} />}
          {effectiveStep === 'processing' && <ProcessingStatus jobStatus={jobStatus} error={jobError} />}
          {effectiveStep === 'results' && jobResults && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                  ✓ Validação concluída!
                </div>
              </div>
              <ResultsTable valid={jobResults.valid} invalid={jobResults.invalid} total={jobResults.total} />
              {jobId && <DownloadButtons jobId={jobId} onNewValidation={handleNewValidation} />}
            </div>
          )}
          {effectiveStep === 'results' && !jobResults && (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-500">Os resultados não puderam ser carregados.</p>
              <button onClick={handleNewValidation} className="text-whatsapp-green hover:underline text-sm">Tentar novamente</button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">
        WhatsApp Validator - Use com responsabilidade. Respeite os Termos de Servico do WhatsApp.
      </footer>
    </div>
  );
}

