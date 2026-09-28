import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  Database,
  Layers,
  Code2,
  BookOpen,
  BarChart3,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { downloadDataManagementPdf, generateDataManagementPdf } from '../utils/pdfGenerator';
import { TABLES_METADATA } from '../data/schemaData';
import { POSTGRESQL_DDL } from '../data/sqlDialects';
import { QUERIES_LIST } from '../data/queriesData';
import { useSisgos } from '../context/SisgosContext';

interface DataManagementReportViewerProps {
  onNavigateTab?: (tab: any) => void;
}

export const DataManagementReportViewer: React.FC<DataManagementReportViewerProps> = ({ onNavigateTab }) => {
  const { projetos, perfis, ordensServico, alocacoes } = useSisgos();

  // Opções de emissão
  const [includeDer, setIncludeDer] = useState(true);
  const [includeDdl, setIncludeDdl] = useState(true);
  const [includeDictionary, setIncludeDictionary] = useState(true);
  const [includeQueries, setIncludeQueries] = useState(true);
  const [institutionName, setInstitutionName] = useState(
    'GOVERNO DO ESTADO • SECRETARIA DE ADMINISTRAÇÃO E PLANEJAMENTO'
  );
  const [issuerName, setIssuerName] = useState('Coordenação de Governança de Dados & TI');

  // Estados de feedback
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Tab ativa de inspeção rápida na tela
  const [previewTab, setPreviewTab] = useState<'der' | 'ddl' | 'dicionario' | 'consultas'>('der');

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      // Pequeno timeout para permitir que a UI renderize o estado de "Gerando..."
      await new Promise((resolve) => setTimeout(resolve, 150));

      downloadDataManagementPdf({
        includeDer,
        includeDdl,
        includeDictionary,
        includeQueries,
        institutionName,
        issuerName,
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF do relatório:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const totalColunas = TABLES_METADATA.reduce((acc, t) => acc + t.columns.length, 0);

  return (
    <div className="space-y-6" id="data-management-report-section">
      {/* Banner Principal com Chamada para Ação */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/40 p-6 shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <FileText className="w-3.5 h-3.5" />
                Relatório Oficial em PDF
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                PostgreSQL 14+ / 16 (Engine Oficial)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                <Database className="w-3.5 h-3.5" />
                3ª Forma Normal (3FN)
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Relatório de Gestão de Dados & Governança
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Documento técnico unificado pronto para exportação em <strong>PDF corporativo</strong>. Reúne em um
              único volume oficial o <strong>Diagrama DER Relacional</strong>, os <strong>Scripts DDL SQL para PostgreSQL</strong>,
              o <strong>Dicionário de Dados & Metadados</strong> e as <strong>Consultas SQL & Relatórios Gerenciais</strong>.
            </p>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[11px] text-slate-400 block">Tabelas Relacionais</span>
                <span className="text-base font-bold text-emerald-400">4 Entidades</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[11px] text-slate-400 block">Atributos Mapeados</span>
                <span className="text-base font-bold text-indigo-400">{totalColunas} Colunas</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[11px] text-slate-400 block">Integridade Referencial</span>
                <span className="text-base font-bold text-amber-400">3 Relacionamentos</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[11px] text-slate-400 block">Queries Gerenciais</span>
                <span className="text-base font-bold text-rose-400">{QUERIES_LIST.length} Relatórios DQL</span>
              </div>
            </div>
          </div>

          {/* Botão de Ação Principal */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 w-full lg:w-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-700 hover:from-rose-500 hover:to-indigo-600 text-white shadow-rose-950/40 hover:scale-[1.02]'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Gerando PDF Oficial...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>PDF Baixado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Baixar Relatório em PDF (.pdf)</span>
                </>
              )}
            </button>

            <div className="text-center">
              <span className="text-[11px] text-slate-400">
                Formato A4 • Padrão Impressão / Documento Oficial
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Customização & Estrutura das 4 Seções */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Opções de Emissão */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Configuração da Emissão</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Órgão / Secretaria Emissora</label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Setor Responsável</label>
                <input
                  type="text"
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <hr className="border-slate-800 my-3" />

            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 block">
                Seções Inclusas no Documento:
              </span>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={includeDer}
                  onChange={(e) => setIncludeDer(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="font-medium">1. Diagrama DER Relacional</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={includeDdl}
                  onChange={(e) => setIncludeDdl(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="font-medium">2. Scripts DDL SQL para PostgreSQL</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={includeDictionary}
                  onChange={(e) => setIncludeDictionary(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="font-medium">3. Dicionário de Metadados (4 Tabelas)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={includeQueries}
                  onChange={(e) => setIncludeQueries(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <span className="font-medium">4. Consultas SQL & Relatórios Gerenciais</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Exportar com Opções Selecionadas</span>
              </button>
            </div>
          </div>

          {/* Card com Dados Atuais do Banco */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status da Base em Tempo Real</span>
            </span>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Projetos Cadastrados:</span>
                <strong className="text-slate-200">{projetos.length}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Perfis Contratados:</span>
                <strong className="text-slate-200">{perfis.length}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Ordens de Serviço:</span>
                <strong className="text-slate-200">{ordensServico.length}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Alocações de Equipe:</span>
                <strong className="text-slate-200">{alocacoes.length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2 e 3: Visualizador das 4 Seções Solicitadas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Navegação entre as 4 Seções */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewTab('der')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                previewTab === 'der'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Diagrama DER</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewTab('ddl')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                previewTab === 'ddl'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-warning" />
              <span>2. Scripts DDL SQL</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewTab('dicionario')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                previewTab === 'dicionario'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>3. Dicionário de Dados</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewTab('consultas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                previewTab === 'consultas'
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
              <span>4. Consultas & Relatórios</span>
            </button>
          </div>

          {/* Conteúdo da Seção 1: DER */}
          {previewTab === 'der' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Seção 1: Diagrama de Entidade-Relacionamento (DER Relacional)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visão das 4 entidades normalizadas, cardinalidades e integridade referencial.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-der')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                  >
                    <span>Abrir Tela DER Interativa</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Tabela de Relacionamentos do DER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400">Projetos ➔ OS</span>
                    <span className="badge bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">1:N</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Um Projeto institucional congrega várias Ordens de Serviço vinculadas via <code className="text-emerald-300">projeto_id</code>.
                  </p>
                  <div className="text-[10px] text-slate-500">
                    Regra: ON UPDATE CASCADE • ON DELETE RESTRICT
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-400">OS ➔ Alocações</span>
                    <span className="badge bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">1:N</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cada Ordem de Serviço possui a alocação de sua equipe técnica vinculada via <code className="text-blue-300">ordem_servico_id</code>.
                  </p>
                  <div className="text-[10px] text-slate-500">
                    Regra: ON UPDATE CASCADE • ON DELETE CASCADE
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400">Perfil ➔ Alocações</span>
                    <span className="badge bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">1:N</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cada posto de trabalho contratado é referenciado com snapshot de custo em <code className="text-amber-300">alocacoes_perfil_os</code>.
                  </p>
                  <div className="text-[10px] text-slate-500">
                    Regra: ON UPDATE CASCADE • ON DELETE RESTRICT
                  </div>
                </div>
              </div>

              {/* Destaque da Entidade Associativa com Snapshot Histórico */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3.5 text-xs text-indigo-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Resolução do Relacionamento N:N e Rastreabilidade Contábil</span>
                </div>
                <p className="text-indigo-200/90 text-[11px] leading-relaxed">
                  A relação N:N entre Ordens de Serviço e Perfis Contratados é intermediada pela tabela associativa{' '}
                  <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-300">alocacoes_perfil_os</code>.
                  Para assegurar conformidade fiscal e evitar que alterações futuras nas tabelas de preços afetem competências passadas,
                  a tabela armazena snapshots de <code className="text-indigo-300">documento_referencia</code> e{' '}
                  <code className="text-indigo-300">custo_mensal_perfil</code>, além de calcular automaticamente o{' '}
                  <code className="text-indigo-300">custo_alocacao</code> via fórmula matemática.
                </p>
              </div>
            </div>
          )}

          {/* Conteúdo da Seção 2: Scripts DDL */}
          {previewTab === 'ddl' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-warning" />
                    <span>Seção 2: Scripts DDL SQL para PostgreSQL (14+ / 16)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comandos CREATE TABLE, PKs, FKs, restrições CHECK, índices e trigger PL/pgSQL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText('ddl-full', POSTGRESQL_DDL)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition border border-slate-700"
                >
                  {copiedSection === 'ddl-full' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">DDL Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar DDL Completo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-4 max-h-[360px] overflow-y-auto">
                <pre className="text-xs font-mono text-indigo-200 leading-relaxed">
                  <code>{POSTGRESQL_DDL.slice(0, 1800)}...</code>
                </pre>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>O arquivo PDF exportado conterá o script DDL integral (580+ linhas) perfeitamente formatado.</span>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-ddl')}
                    className="text-indigo-400 hover:underline"
                  >
                    Ver na aba DDL ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Conteúdo da Seção 3: Dicionário de Dados */}
          {previewTab === 'dicionario' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Seção 3: Dicionário de Dados & Metadados das Tabelas</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Catálogo de atributos físicos, tipos relacionais, nulidade, chaves e descrições.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-dicionario')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                  >
                    <span>Ver Dicionário Completo</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {TABLES_METADATA.map((tbl) => (
                  <div key={tbl.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">{tbl.name}</span>
                        <span className="text-xs text-slate-400">({tbl.displayName})</span>
                      </div>
                      <span className="badge bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                        {tbl.columns.length} colunas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">{tbl.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tbl.columns.slice(0, 6).map((col) => (
                        <span
                          key={col.name}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800"
                        >
                          {col.name} {col.isPk && <span className="text-rose-400 font-bold">(PK)</span>}
                          {col.isFk && <span className="text-blue-400 font-bold">(FK)</span>}
                        </span>
                      ))}
                      {tbl.columns.length > 6 && (
                        <span className="px-2 py-0.5 rounded text-[10px] text-slate-500">
                          +{tbl.columns.length - 6} outras colunas no PDF
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conteúdo da Seção 4: Consultas SQL */}
          {previewTab === 'consultas' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-rose-400" />
                    <span>Seção 4: Consultas SQL & Relatórios Gerenciais (DQL)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scripts prontos com JOINs, agregações e cruzamentos para relatórios gerenciais e BI.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('admin-consultas')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                  >
                    <span>Ver Consultas SQL</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {QUERIES_LIST.map((q) => (
                  <div key={q.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{q.title}</span>
                      <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                        {q.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{q.description}</p>
                    <div className="text-[10px] text-slate-500">
                      <strong>Objetivo:</strong> {q.objective}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
