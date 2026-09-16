import React, { useState } from 'react';
import { Calculator, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Database, RefreshCw, Copy, Check } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

interface ContractedProfileSample {
  id: number;
  item_contratacao: string;
  nome_perfil: string;
  documento_referencia: string;
  vigente: boolean;
  custo_mensal_perfil: number;
  quantidade_mensal_contratada: number;
}

const SAMPLE_PROFILES: ContractedProfileSample[] = [
  {
    id: 1,
    item_contratacao: 'Item 01',
    nome_perfil: 'Líder Técnico / Arquiteto de Software',
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    vigente: true,
    custo_mensal_perfil: 18500.00,
    quantidade_mensal_contratada: 3
  },
  {
    id: 2,
    item_contratacao: 'Item 02',
    nome_perfil: 'Desenvolvedor Full-Stack Sênior',
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    vigente: true,
    custo_mensal_perfil: 14200.00,
    quantidade_mensal_contratada: 6
  },
  {
    id: 3,
    item_contratacao: 'Item 03',
    nome_perfil: 'Desenvolvedor Full-Stack Pleno',
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    vigente: true,
    custo_mensal_perfil: 9800.00,
    quantidade_mensal_contratada: 10
  },
  {
    id: 4,
    item_contratacao: 'Item 04',
    nome_perfil: 'Analista de Requisitos e Negócios Pleno',
    documento_referencia: 'Contrato 45/2024 - Lote 2',
    vigente: true,
    custo_mensal_perfil: 9500.00,
    quantidade_mensal_contratada: 4
  },
  {
    id: 5,
    item_contratacao: 'Item 05',
    nome_perfil: 'Engenheiro de DevOps / Cloud Sênior',
    documento_referencia: 'Contrato 45/2024 - Lote 2',
    vigente: true,
    custo_mensal_perfil: 15000.00,
    quantidade_mensal_contratada: 2
  }
];

interface SampleOs {
  id: number;
  label: string;
  ne_planejamento: string | null;
  ne_faturamento: string | null;
  processo_sei_pagamento: string | null;
}

const SAMPLE_OS_LIST: SampleOs[] = [
  { id: 101, label: 'OS nº 101/2026 - SGC-CORP (SEPLAG)', ne_planejamento: '2026NE000142', ne_faturamento: '2026NE000189', processo_sei_pagamento: 'SEI-08001/002341/2026' },
  { id: 102, label: 'OS nº 102/2026 - SGC-CORP (SEPLAG)', ne_planejamento: '2026NE000142', ne_faturamento: null, processo_sei_pagamento: null },
  { id: 201, label: 'OS nº 201/2026 - TRANS-SEFAZ (SEFAZ)', ne_planejamento: '2026NE000215', ne_faturamento: '2026NE000280', processo_sei_pagamento: 'SEI-08001/002955/2026' },
  { id: 301, label: 'OS nº 301/2026 - PEU-SAUDE (SES)', ne_planejamento: '2026NE000301', ne_faturamento: '2026NE000301', processo_sei_pagamento: 'SEI-08001/003112/2026' },
];

export const BusinessRuleSimulator: React.FC = () => {
  const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
  const [selectedOsId, setSelectedOsId] = useState<number>(101);
  const [mesReferencia, setMesReferencia] = useState<string>('JANEIRO');
  const [nomeProfissional, setNomeProfissional] = useState<string>('Carlos Eduardo Mendes');
  const [percentualAlocacao, setPercentualAlocacao] = useState<number>(100);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const selectedProfile = SAMPLE_PROFILES.find(p => p.id === selectedProfileId) || SAMPLE_PROFILES[0];
  const selectedOs = SAMPLE_OS_LIST.find(o => o.id === selectedOsId) || SAMPLE_OS_LIST[0];
  
  // Rule calculation
  const custoCalculado = (percentualAlocacao * selectedProfile.custo_mensal_perfil) / 100;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const generatedInsertSql = `-- Inserção na tabela associativa 'alocacoes_perfil_os'
-- Com o TRIGGER instalado no banco, basta informar os dados de entrada:
-- Restrição de Unicidade: CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, nome_profissional, mes_referencia)
-- Observação: NE Planejamento, NE Faturamento e Processo SEI pertencem à tabela 'ordens_servico'
INSERT INTO alocacoes_perfil_os (
    ordem_servico_id,
    perfil_contratado_id,
    mes_referencia,
    nome_profissional,
    percentual_alocacao
) VALUES (
    (SELECT id FROM ordens_servico WHERE numero_os = ${selectedOs.id} LIMIT 1),
    ${selectedProfile.id},
    '${mesReferencia}',
    '${nomeProfissional}',
    ${percentualAlocacao.toFixed(2)}
);

-- RESULTADO GERADO NO BANCO PELO TRIGGER:
-- documento_referencia = '${selectedProfile.documento_referencia}'
-- custo_mensal_perfil  = ${selectedProfile.custo_mensal_perfil.toFixed(2)}
-- custo_alocacao       = ${custoCalculado.toFixed(2)} (${formatBRL(custoCalculado)})`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(generatedInsertSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6" id="business-rule-simulator">
      {/* Rule Explanation Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Simulador Interativo da Regra de Negócio & Trigger</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Snapshot Histórico + Cálculo Automático
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ao inserir uma alocação, o banco copia automaticamente o <strong className="text-indigo-300">Custo Mensal</strong> e o <strong className="text-indigo-300">Documento de Referência</strong> do perfil contratado original, e calcula:
            </p>
            <div className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
              Custo da Alocação = (Percentual de Alocação × Custo Mensal do Perfil) ÷ 100
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Inputs & Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Inputs */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Parâmetros de Entrada da Alocação</span>
            <span className="text-[11px] font-normal text-indigo-400">Tabela de Origem</span>
          </h4>

          {/* OS Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Ordem de Serviço (OS):</label>
            <select
              value={selectedOsId}
              onChange={(e) => setSelectedOsId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={101}>OS nº 101/2026 - SGC-CORP (SEPLAG)</option>
              <option value={102}>OS nº 102/2026 - SGC-CORP (SEPLAG)</option>
              <option value={201}>OS nº 201/2026 - TRANS-SEFAZ (SEFAZ)</option>
              <option value={301}>OS nº 301/2026 - PEU-SAUDE (SES)</option>
            </select>
          </div>

          {/* Mês de Referência da Alocação */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Mês de Referência da Alocação:</label>
            <select
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {[
                'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
                'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
              ].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Profile Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Perfil Contratado Associado:</label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {SAMPLE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.item_contratacao} - {p.nome_perfil} ({formatBRL(p.custo_mensal_perfil)}/mês)
                </option>
              ))}
            </select>
          </div>

          {/* Professional Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nome do Profissional:</label>
            <input
              type="text"
              value={nomeProfissional}
              onChange={(e) => setNomeProfissional(e.target.value)}
              placeholder="Ex: Carlos Eduardo Mendes"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Contexto da OS Selecionada (NEs e Processo SEI) */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Dados Orçamentários da OS #{selectedOs.id}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Nível Ordem de Serviço
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 d-block">NE Planejamento:</span>
                <span className="font-mono font-medium text-slate-200 block truncate">
                  {selectedOs.ne_planejamento || '—'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 d-block">NE Faturamento:</span>
                <span className="font-mono font-medium text-emerald-300 block truncate">
                  {selectedOs.ne_faturamento || '—'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 d-block">Processo SEI:</span>
                <span className="font-mono font-medium text-indigo-300 block truncate">
                  {selectedOs.processo_sei_pagamento || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Slider & Input */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Percentual de Alocação:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={percentualAlocacao}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) {
                      setPercentualAlocacao(0);
                    } else {
                      setPercentualAlocacao(Math.min(100, Math.max(0, parseFloat(val.toFixed(2)))));
                    }
                  }}
                  className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-center rounded bg-slate-900 text-indigo-300 border border-indigo-500/40 focus:outline-none focus:border-indigo-400"
                />
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {formatPercent(percentualAlocacao)}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.25"
              value={percentualAlocacao}
              onChange={(e) => setPercentualAlocacao(parseFloat(Number(e.target.value).toFixed(2)))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Sem dedicação)</span>
              <span>33.33% / 50%</span>
              <span>100% (Integral)</span>
            </div>
          </div>
        </div>

        {/* Live Output & Database Execution */}
        <div className="p-5 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Snapshot Gravado & Valores Calculados</span>
            <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gatilho Executado
            </span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Documento Copiado</p>
              <p className="text-xs font-semibold text-slate-200 mt-1 truncate" title={selectedProfile.documento_referencia}>
                {selectedProfile.documento_referencia}
              </p>
              <span className="text-[9px] text-indigo-400">Snapshot de Contrato</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Custo Mensal Base</p>
              <p className="text-xs font-semibold text-slate-200 mt-1">
                {formatBRL(selectedProfile.custo_mensal_perfil)}
              </p>
              <span className="text-[9px] text-indigo-400">Preço Congelado</span>
            </div>
          </div>

          {/* Main Calculation Big Box */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-indigo-300 font-medium">Custo da Alocação (Calculado)</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatBRL(custoCalculado)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                ({formatPercent(percentualAlocacao)} de {formatBRL(selectedProfile.custo_mensal_perfil)})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* SQL Generated Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Instrução SQL Executada:</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 transition"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar DML'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-32">
              <code>{generatedInsertSql}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
