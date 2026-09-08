import React, { useState } from 'react';
import { TABLES_METADATA } from '../data/schemaData';
import { Key, Link2, Sparkles, ArrowRight, Database, Layers, CheckCircle2 } from 'lucide-react';

export const ERDiagram: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const getTableColor = (type: string, id: string) => {
    if (selectedTable === id) return 'ring-2 ring-indigo-400 border-indigo-500 bg-slate-900/90';
    if (type === 'associative') return 'border-amber-500/40 bg-slate-900/60 hover:border-amber-400';
    if (id === 'projetos') return 'border-emerald-500/40 bg-slate-900/60 hover:border-emerald-400';
    if (id === 'ordens_servico') return 'border-blue-500/40 bg-slate-900/60 hover:border-blue-400';
    return 'border-violet-500/40 bg-slate-900/60 hover:border-violet-400';
  };

  const getBadgeColor = (type: string, id: string) => {
    if (type === 'associative') return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    if (id === 'projetos') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (id === 'ordens_servico') return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    return 'bg-violet-500/10 text-violet-300 border-violet-500/30';
  };

  return (
    <div className="space-y-6" id="er-diagram-section">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="er-overview-cards">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Relacionamento 1:N</p>
              <h3 className="text-sm font-semibold text-slate-200">Projeto ➔ Ordens de Serviço</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Um Projeto institucional agrupa múltiplas Ordens de Serviço vinculadas via <code className="text-emerald-300">projeto_id</code>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Relacionamento N:N</p>
              <h3 className="text-sm font-semibold text-slate-200">OS ⟷ Perfis Contratados</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Muitos para muitos resolvido pela tabela associativa <code className="text-amber-300">alocacoes_perfil_os</code>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Regra de Snapshot & Cálculo</p>
              <h3 className="text-sm font-semibold text-slate-200">Custo & Documento Automáticos</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Congelamento de preço e documento no momento do registro + cálculo automático via Trigger PL/pgSQL.
          </p>
        </div>
      </div>

      {/* Diagram Layout */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden" id="diagram-canvas">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Diagrama de Entidade-Relacionamento (DER Relacional)</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                4 Tabelas Modeladas
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Clique nas tabelas para destacar seus relacionamentos e atributos detalhados.
            </p>
          </div>
          {selectedTable && (
            <button
              onClick={() => setSelectedTable(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Limpar Seleção
            </button>
          )}
        </div>

        {/* Visual Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {TABLES_METADATA.map((table) => {
            const isSelected = selectedTable === table.id;
            return (
              <div
                key={table.id}
                id={`table-card-${table.id}`}
                onClick={() => setSelectedTable(isSelected ? null : table.id)}
                className={`rounded-xl border transition-all duration-200 cursor-pointer shadow-lg ${getTableColor(table.type, table.id)}`}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getBadgeColor(table.type, table.id)}`}>
                      {table.type === 'associative' ? 'Tabela Associativa (N:N)' : 'Entidade'}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm">{table.displayName}</h4>
                    <p className="text-[11px] font-mono text-slate-400">{table.name}</p>
                  </div>
                </div>

                {/* Columns List */}
                <div className="p-3 space-y-1.5 text-xs max-h-[380px] overflow-y-auto">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className={`p-1.5 rounded flex items-center justify-between gap-2 ${
                        col.isPk
                          ? 'bg-amber-500/10 text-amber-200 font-semibold'
                          : col.isFk
                          ? 'bg-indigo-500/10 text-indigo-200'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {col.isPk && <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {col.isFk && <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        <span className="truncate" title={col.originalName}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                        {col.type.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer / Relationships count */}
                <div className="p-2.5 bg-slate-950/40 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{table.columns.length} colunas</span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <ArrowRight className="w-3 h-3 text-indigo-400" />
                    <span>{table.relationships.length} vínculo(s)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Table Relationship Drawer */}
        {selectedTable && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-indigo-500/40 animate-fadeIn" id="relationship-details">
            {(() => {
              const table = TABLES_METADATA.find(t => t.id === selectedTable);
              if (!table) return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-semibold text-slate-200">
                        Vínculos da Tabela: <span className="text-indigo-400 font-mono">{table.name}</span> ({table.displayName})
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">{table.description}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {table.relationships.map((rel, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-col justify-between gap-1">
                        <div className="flex items-center justify-between text-indigo-300 font-semibold">
                          <span>Cardialidade: {rel.type}</span>
                          <span className="font-mono text-[11px] text-slate-400">➔ {rel.targetTable}</span>
                        </div>
                        <p className="text-slate-300">{rel.description}</p>
                        <p className="text-[10px] font-mono text-slate-400">FK: {rel.foreignKey}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
