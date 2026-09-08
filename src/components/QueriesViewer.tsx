import React, { useState } from 'react';
import { Database, TrendingUp, AlertTriangle, Users, Copy, Check } from 'lucide-react';

interface QueryItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  sql: string;
}

const QUERIES_LIST: QueryItem[] = [
  {
    id: 'relatorio-consolidado',
    title: 'Relatório Consolidado de OS por Secretaria & Projeto',
    description: 'Agrupa as Ordens de Serviço totalizando a quantidade de profissionais alocados, percentual total e custo financeiro consolidado.',
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    sql: `SELECT 
    p.sigla_secretaria AS secretaria,
    p.sigla_projeto AS projeto,
    os.numero_os,
    os.mes_referencia,
    os.ano_referencia,
    os.situacao_sgc,
    os.situacao_passivo_2026,
    COUNT(a.id) AS total_profissionais,
    COALESCE(SUM(a.percentual_alocacao), 0) AS total_percentual_alocado,
    COALESCE(SUM(a.custo_alocacao), 0.00) AS custo_total_os
FROM ordens_servico os
JOIN projetos p ON p.id = os.projeto_id
LEFT JOIN alocacoes_perfil_os a ON a.ordem_servico_id = os.id
GROUP BY 
    p.sigla_secretaria, p.sigla_projeto, os.id, os.numero_os, 
    os.mes_referencia, os.ano_referencia, os.situacao_sgc, os.situacao_passivo_2026
ORDER BY p.sigla_secretaria, os.ano_referencia DESC, os.numero_os ASC;`
  },
  {
    id: 'detalhamento-equipe',
    title: 'Detalhamento de Equipe e Histórico Contratual por OS',
    description: 'Lista cada profissional alocado em cada OS, evidenciando o snapshot do documento de referência e custo histórico.',
    icon: <Users className="w-4 h-4 text-blue-400" />,
    sql: `SELECT 
    os.numero_os,
    os.mes_referencia || '/' || os.ano_referencia AS competencia,
    p.sigla_projeto,
    a.nome_profissional,
    pc.nome_perfil,
    a.percentual_alocacao || '%' AS alocacao,
    a.documento_referencia AS doc_ref_historico,
    a.custo_mensal_perfil AS custo_mensal_snapshot,
    a.custo_alocacao AS custo_calculado
FROM alocacoes_perfil_os a
JOIN ordens_servico os ON os.id = a.ordem_servico_id
JOIN projetos p ON p.id = os.projeto_id
JOIN perfis_contratados pc ON pc.id = a.perfil_contratado_id
ORDER BY os.numero_os, a.nome_profissional;`
  },
  {
    id: 'painel-sgc-passivo',
    title: 'Auditoria de Pendências no SGC & Passivo 2026',
    description: 'Identifica ordens de serviço com pendências de alocação, entrega ou descrição no SGC, ou com passivo orçamentário registrado para 2026.',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    sql: `SELECT 
    p.sigla_secretaria,
    p.sigla_projeto,
    os.numero_os,
    os.mes_referencia,
    os.ano_referencia,
    CASE WHEN os.alocacao_sgc THEN 'OK' ELSE 'PENDENTE' END AS alocacao_sgc_status,
    CASE WHEN os.entrega_sgc THEN 'OK' ELSE 'PENDENTE' END AS entrega_sgc_status,
    CASE WHEN os.descricao_sgc THEN 'OK' ELSE 'PENDENTE' END AS descricao_sgc_status,
    os.situacao_passivo_2026
FROM ordens_servico os
JOIN projetos p ON p.id = os.projeto_id
WHERE os.alocacao_sgc = FALSE 
   OR os.entrega_sgc = FALSE 
   OR os.descricao_sgc = FALSE
   OR os.situacao_passivo_2026 IS NOT NULL
ORDER BY p.sigla_secretaria, os.numero_os;`
  }
];

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
                  {q.icon}
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
