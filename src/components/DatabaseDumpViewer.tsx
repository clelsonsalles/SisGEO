import React, { useState, useEffect } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { generateSqlDump, downloadSqlFile } from '../utils/dumpGenerator';
import { apiService } from '../services/api';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Database,
  FileCode,
  Layers,
  Terminal,
  Server,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const DatabaseDumpViewer: React.FC = () => {
  const { projetos, perfis, ordensServico, alocacoes, refreshData, isSyncing } = useSisgos();

  const [includeDdl, setIncludeDdl] = useState<boolean>(true);
  const [includeData, setIncludeData] = useState<boolean>(true);
  const [includeTriggers, setIncludeTriggers] = useState<boolean>(true);
  const [includeDrop, setIncludeDrop] = useState<boolean>(true);

  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [dumpText, setDumpText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Generate or fetch dump whenever data or options change
  useEffect(() => {
    const generated = generateSqlDump(projetos, perfis, ordensServico, alocacoes, {
      includeDdl,
      includeData,
      includeTriggers,
      includeDrop,
    });
    setDumpText(generated);
  }, [projetos, perfis, ordensServico, alocacoes, includeDdl, includeData, includeTriggers, includeDrop]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dumpText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      // Tenta baixar diretamente da API se disponível
      const serverDump = await apiService.adminGetSqlDump({
        ddl: includeDdl,
        data: includeData,
        triggers: includeTriggers,
        drop: includeDrop,
      }).catch(() => null);

      const contentToDownload = serverDump || dumpText;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadSqlFile(contentToDownload, `dump_sisgos_${timestamp}.sql`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      // Fallback para download local
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadSqlFile(dumpText, `dump_sisgos_${timestamp}.sql`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRegistros = perfis.length + projetos.length + ordensServico.length + alocacoes.length;
  const estimatedSizeKb = (new Blob([dumpText]).size / 1024).toFixed(1);
  const totalLinhas = dumpText.split('\n').length;

  return (
    <div className="space-y-4" id="database-dump-section">
      {/* Header & Main Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Extração de DUMP Completo (.sql)
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PostgreSQL
                </span>
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              Exporte todos os scripts DDL (tabelas, constraints, triggers) e DML (inserts de todos os dados atuais) em um único arquivo padrão <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded text-xs">.sql</code> pronto para restauração.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-recarregar-dump"
              onClick={() => refreshData()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Recarregar dados atuais do banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing ? 'Atualizando...' : 'Atualizar Dados'}</span>
            </button>

            <button
              type="button"
              id="btn-copiar-dump-sql"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Copiar todo o script SQL para a área de transferência"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-baixar-dump-sql"
              onClick={handleDownload}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition border border-emerald-500/50"
              title="Baixar arquivo dump_sisgos.sql completo"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Download Concluído!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo .sql</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informational Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Tabelas Relacionais</div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-1 mt-0.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>4 Tabelas</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">perfis, projetos, OSs, alocações</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Registros Cadastrados</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{totalRegistros} Linhas DML</span>
            </div>
            <div className="text-[10px] text-slate-500">{ordensServico.length} OSs • {alocacoes.length} Alocações</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Tamanho do Arquivo</div>
            <div className="text-lg font-bold text-amber-400 flex items-center gap-1 mt-0.5">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>~{estimatedSizeKb} KB</span>
            </div>
            <div className="text-[10px] text-slate-500">{totalLinhas} linhas SQL geradas</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Dialeto & Integridade</div>
            <div className="text-lg font-bold text-sky-400 flex items-center gap-1 mt-0.5">
              <Server className="w-4 h-4 text-sky-400" />
              <span>PostgreSQL 16+</span>
            </div>
            <div className="text-[10px] text-slate-500">Transação BEGIN / COMMIT</div>
          </div>
        </div>
      </div>

      {/* Dump Configuration Filter Bar */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Configuração do Conteúdo do DUMP:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={includeDdl}
              onChange={(e) => setIncludeDdl(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Estrutura (DDL CREATE TABLE)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={includeData}
              onChange={(e) => setIncludeData(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Dados Atuais (DML INSERTs)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={includeTriggers}
              onChange={(e) => setIncludeTriggers(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Trigger PL/pgSQL</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={includeDrop}
              onChange={(e) => setIncludeDrop(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>DROP TABLE IF EXISTS</span>
          </label>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">dump_sisgos.sql</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Codificação UTF-8</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>{totalLinhas} linhas</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-300 hover:text-white flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <pre
            className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px] select-all scrollbar-thin scrollbar-thumb-slate-700"
            style={{ tabSize: 2 }}
          >
            <code>{dumpText}</code>
          </pre>
        </div>
      </div>

      {/* How to restore instructions card */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs space-y-2">
        <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Como Restaurar este DUMP no PostgreSQL
        </div>
        <p className="text-slate-400">
          Para restaurar o banco de dados a partir do arquivo <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">.sql</code> gerado:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1">Opção A: No Container Docker (Recomendado)</div>
            <pre className="text-[11px] text-emerald-400 bg-slate-900/80 p-2 rounded border border-slate-800 overflow-x-auto">
              <code>docker compose exec -T postgres psql -U sisgos_user -d sisgos_db &lt; dump_sisgos.sql</code>
            </pre>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="font-semibold text-slate-200 mb-1">Opção B: Via Terminal psql Direto</div>
            <pre className="text-[11px] text-emerald-400 bg-slate-900/80 p-2 rounded border border-slate-800 overflow-x-auto">
              <code>psql -h localhost -p 5432 -U sisgos_user -d sisgos_db -f dump_sisgos.sql</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
