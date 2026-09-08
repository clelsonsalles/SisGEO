import React, { useState } from 'react';
import { SQLDialect } from '../types/schema';
import { POSTGRESQL_DDL, MYSQL_DDL, SQLSERVER_DDL, SQLITE_DDL, SEEDS_SQL, QUERIES_SQL } from '../data/sqlDialects';
import { Copy, Check, Download, FileCode, Sparkles, Terminal } from 'lucide-react';

export const DDLViewer: React.FC = () => {
  const [activeDialect, setActiveDialect] = useState<SQLDialect>('postgresql');
  const [copied, setCopied] = useState(false);

  const getSQLContent = () => {
    switch (activeDialect) {
      case 'postgresql':
        return { code: POSTGRESQL_DDL, filename: 'schema_postgresql_ordens_servico.sql' };
      case 'mysql':
        return { code: MYSQL_DDL, filename: 'schema_mysql_ordens_servico.sql' };
      case 'sqlserver':
        return { code: SQLSERVER_DDL, filename: 'schema_sqlserver_ordens_servico.sql' };
      case 'sqlite':
        return { code: SQLITE_DDL, filename: 'schema_sqlite_ordens_servico.sql' };
      case 'seeds':
        return { code: SEEDS_SQL, filename: 'seeds_exemplos_ordens_servico.sql' };
      case 'queries':
        return { code: QUERIES_SQL, filename: 'queries_relatorios_ordens_servico.sql' };
    }
  };

  const current = getSQLContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([current.code], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = current.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const dialectTabs: { id: SQLDialect; label: string; badge?: string }[] = [
    { id: 'postgresql', label: 'PostgreSQL (Recomendado)', badge: 'Triggers PL/pgSQL' },
    { id: 'mysql', label: 'MySQL / MariaDB', badge: 'InnoDB' },
    { id: 'sqlserver', label: 'SQL Server', badge: 'T-SQL' },
    { id: 'sqlite', label: 'SQLite / ANSI', badge: 'Standard' },
    { id: 'seeds', label: 'Carga de Dados (Seeds)', badge: 'Exemplos' },
    { id: 'queries', label: 'Consultas & Relatórios', badge: 'DQL' },
  ];

  return (
    <div className="space-y-4" id="ddl-viewer-section">
      {/* Dialect Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap gap-1.5" id="dialect-tabs">
          {dialectTabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveDialect(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeDialect === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeDialect === tab.id
                    ? 'bg-indigo-800/80 text-indigo-100'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            id="copy-sql-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
            title="Copiar código SQL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            id="download-sql-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
            title="Baixar arquivo .sql"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .sql</span>
          </button>
        </div>
      </div>

      {/* Code Window */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-slate-300 ml-2 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              {current.filename}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {current.code.split('\n').length} linhas
          </span>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[620px] overflow-y-auto">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed">
            <code>{current.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
