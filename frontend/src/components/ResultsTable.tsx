import { useState } from 'react';
import type { NumberResult } from '../types';

interface ResultsTableProps {
  valid: NumberResult[];
  invalid: NumberResult[];
  total: number;
}

type Tab = 'valid' | 'invalid' | 'all';

/**
 * Etapa 4 (parte 1): Tabela com os resultados da validação.
 *
 * - Abas: Válidos / Não Encontrados / Todos
 * - Badges com contadores em cada aba
 * - Linha de busca para filtrar números
 * - Ícone de status por número
 */
export function ResultsTable({ valid, invalid, total }: ResultsTableProps) {
  const [activeTab, setActiveTab] = useState<Tab>('valid');
  const [search, setSearch] = useState('');

  const allResults: NumberResult[] = [
    ...valid.map((r) => ({ ...r, exists: true })),
    ...invalid.map((r) => ({ ...r, exists: false })),
  ];

  const dataByTab: Record<Tab, NumberResult[]> = {
    valid,
    invalid,
    all: allResults,
  };

  const filtered = dataByTab[activeTab].filter((r) =>
    r.phone.includes(search.trim()),
  );

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: 'valid', label: '✓ No WhatsApp', count: valid.length, color: 'text-green-600 border-green-500' },
    { key: 'invalid', label: '✗ Não Encontrados', count: invalid.length, color: 'text-red-500 border-red-400' },
    { key: 'all', label: 'Todos', count: total, color: 'text-gray-600 border-gray-500' },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{valid.length}</p>
          <p className="text-xs text-green-500 mt-1">No WhatsApp</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{invalid.length}</p>
          <p className="text-xs text-red-400 mt-1">Não encontrados</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-400 mt-1">Total</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === tab.key
                ? `${tab.color} bg-white`
                : 'text-gray-400 border-transparent hover:text-gray-600'
              }
            `}
          >
            {tab.label}
            <span
              className={`
                px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${activeTab === tab.key ? 'bg-current/10' : 'bg-gray-100 text-gray-400'}
              `}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Buscar número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green/30 focus:border-whatsapp-green"
        />
      </div>

      {/* Tabela */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {search ? `Nenhum número encontrado para "${search}"` : 'Sem resultados nesta aba'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {filtered.map((result, i) => (
              <div
                key={`${result.phone}-${i}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* Status icon */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${result.exists ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}
                  `}
                >
                  {result.exists ? '✓' : '✗'}
                </div>

                {/* Número */}
                <span className="flex-1 text-sm font-mono text-gray-700">
                  +{result.phone}
                </span>

                {/* Badge */}
                <span
                  className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${result.exists
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-red-50 text-red-500 border border-red-200'
                    }
                  `}
                >
                  {result.exists ? 'WhatsApp ✓' : 'Não encontrado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Exibindo {filtered.length} de {dataByTab[activeTab].length} número{dataByTab[activeTab].length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
