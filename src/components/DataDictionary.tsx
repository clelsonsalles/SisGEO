import React, { useState } from 'react';
import { TABLES_METADATA } from '../data/schemaData';
import { Search, Database, Key, Link2, ShieldCheck, HelpCircle, Layers } from 'lucide-react';

export const DataDictionary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTable, setFilterTable] = useState<string>('all');

  const filteredTables = TABLES_METADATA.filter((t) => {
    if (filterTable !== 'all' && t.id !== filterTable) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchTableName = t.displayName.toLowerCase().includes(term) || t.name.toLowerCase().includes(term);
    const matchColumn = t.columns.some(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.originalName.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
    );
    return matchTableName || matchColumn;
  });

  return (
    <div className="space-y-6" id="data-dictionary-section">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar campos, tipos, regras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterTable('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterTable === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas as Tabelas
          </button>
          {TABLES_METADATA.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTable(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filterTable === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Accordion / Grid */}
      <div className="space-y-6">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            id={`dict-table-${table.id}`}
            className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg"
          >
            {/* Table Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">{table.displayName}</h3>
                    <span className="font-mono text-xs text-indigo-400">({table.name})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {table.type === 'associative' ? 'Associativa N:N' : 'Entidade'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{table.description}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {table.columns.length} colunas mapeadas
              </span>
            </div>

            {/* Table Columns Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-medium">
                    <th className="py-2.5 px-4">Coluna no BD</th>
                    <th className="py-2.5 px-4">Nome Original</th>
                    <th className="py-2.5 px-4">Tipo SQL</th>
                    <th className="py-2.5 px-4">Nulo / Padrão</th>
                    <th className="py-2.5 px-4">Chaves & Restrições</th>
                    <th className="py-2.5 px-4">Descrição & Regras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {table.columns.map((col) => (
                    <tr
                      key={col.name}
                      className={`hover:bg-slate-900/30 transition-colors ${
                        col.isPk ? 'bg-amber-500/5' : col.isFk ? 'bg-indigo-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          {col.isPk && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              PK
                            </span>
                          )}
                          {col.isFk && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              FK
                            </span>
                          )}
                          <span>{col.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{col.originalName}</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-400 text-[11px]">{col.type}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {col.nullable ? (
                          <span className="text-slate-400">NULL</span>
                        ) : (
                          <span className="text-rose-300/90 font-medium">NOT NULL</span>
                        )}
                        {col.defaultValue && (
                          <span className="block text-[10px] text-slate-400">
                            Default: {col.defaultValue}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {col.fkTarget && (
                          <span className="inline-block text-[11px] text-indigo-300 font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60 mb-1">
                            ➔ {col.fkTarget}
                          </span>
                        )}
                        {col.checkConstraint && (
                          <span className="inline-block text-[10px] text-amber-300/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                            CHECK ({col.checkConstraint})
                          </span>
                        )}
                        {!col.fkTarget && !col.checkConstraint && !col.isPk && (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 max-w-xs">
                        <p>{col.description}</p>
                        {col.businessRule && (
                          <div className="mt-1 p-1.5 rounded bg-indigo-950/50 border border-indigo-800/40 text-[11px] text-indigo-300 font-medium">
                            ⚡ Regra de Negócio: {col.businessRule}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
