import React, { useState } from 'react';
import { Database, TrendingUp, AlertTriangle, Users, Copy, Check, PieChart } from 'lucide-react';
import { QUERIES_LIST, QueryItem } from '../data/queriesData';

const getQueryIcon = (id: string) => {
  switch (id) {
    case 'relatorio-consolidado':
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case 'detalhamento-equipe':
      return <Users className="w-4 h-4 text-blue-400" />;
    case 'painel-sgc-passivo':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'distribuicao-por-perfil':
      return <PieChart className="w-4 h-4 text-violet-400" />;
    default:
      return <Database className="w-4 h-4 text-indigo-400" />;
  }
};

export const QueriesViewer: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6" id="queries-viewer-section">
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>Consultas SQL Prontas para Relatórios e Acompanhamento</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Scripts DQL otimizados com JOINs, agregações e filtros específicos para as regras de gestão de Ordens de Serviço, SGC e Passivo 2026.
        </p>
      </div>

      <div className="space-y-4">
        {QUERIES_LIST.map((q) => (
          <div key={q.id} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                  {getQueryIcon(q.id)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{q.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{q.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleCopy(q.id, q.sql)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition border border-slate-700"
              >
                {copiedId === q.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar Query</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 overflow-x-auto bg-slate-950">
              <pre className="font-mono text-xs text-indigo-200 leading-relaxed">
                <code>{q.sql}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
