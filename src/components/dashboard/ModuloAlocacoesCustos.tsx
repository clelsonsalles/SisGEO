import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSisgos } from '../../context/SisgosContext';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { MESES_REFERENCIA, MesReferencia } from '../../types/models';
import { ActiveTab } from '../Navbar';

Chart.register(...registerables);

interface ModuloAlocacoesCustosProps {
  onVoltarHub: () => void;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ModuloAlocacoesCustos: React.FC<ModuloAlocacoesCustosProps> = ({
  onVoltarHub,
  onNavigate,
}) => {
  const { ordensServico, projetos, perfis, alocacoes } = useSisgos();

  // Canvas refs for Chart.js
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);

  // Instances of Chart.js
  const barChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  // Filter States
  const [filtroNumeroOs, setFiltroNumeroOs] = useState<string>('TODOS');
  const [filtroProjeto, setFiltroProjeto] = useState<string>('TODOS');
  const [filtroAno, setFiltroAno] = useState<string>('TODOS');
  const [filtroMes, setFiltroMes] = useState<string>('TODOS');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('TODOS');
  const [filtroUnidadeProjeto, setFiltroUnidadeProjeto] = useState<string>('TODOS');
  const [filtroSecretaria, setFiltroSecretaria] = useState<string>('TODOS');

  // Distribution chart metric switch: 'perfil' | 'os' | 'secretaria'
  const [pieAgrupamento, setPieAgrupamento] = useState<'perfil' | 'os' | 'secretaria'>('perfil');
  const [chartType, setChartType] = useState<'doughnut' | 'pie'>('doughnut');

  // Table search
  const [termoBuscaTabela, setTermoBuscaTabela] = useState<string>('');

  // 1. Dynamic lists for filter selects
  const listaNumerosOs = useMemo(() => {
    return Array.from(new Set(ordensServico.map((os) => os.numero_os))).sort((a, b) => a - b);
  }, [ordensServico]);

  const listaAnos = useMemo(() => {
    return Array.from(new Set(ordensServico.map((os) => os.ano_referencia))).sort((a, b) => b - a);
  }, [ordensServico]);

  const listaUnidadesProjetos = useMemo(() => {
    return Array.from(new Set(projetos.map((p) => p.sigla_projeto))).sort();
  }, [projetos]);

  const listaSecretarias = useMemo(() => {
    const secMap = new Map<string, string>();
    projetos.forEach((p) => {
      secMap.set(p.sigla_secretaria, p.nome_secretaria);
    });
    return Array.from(secMap.entries()).map(([sigla, nome]) => ({ sigla, nome }));
  }, [projetos]);

  // 2. Joined Allocations with OS and Project info
  interface AlocacaoEnriquecida {
    id: number;
    ordem_servico_id: number;
    numero_os: number;
    ano_referencia: number;
    mes_referencia: MesReferencia;
    projeto_id: number;
    nome_projeto: string;
    sigla_projeto: string;
    sigla_secretaria: string;
    nome_secretaria: string;
    perfil_contratado_id: number;
    nome_perfil: string;
    nome_profissional: string;
    percentual_alocacao: number;
    custo_mensal_perfil: number;
    custo_alocacao: number;
    documento_referencia: string;
    ne_planejamento?: string | null;
    ne_faturamento?: string | null;
    processo_sei_pagamento?: string | null;
  }

  const alocacoesEnriquecidas = useMemo<AlocacaoEnriquecida[]>(() => {
    return alocacoes.map((aloc) => {
      const os = ordensServico.find((o) => o.id === aloc.ordem_servico_id);
      const proj = os ? projetos.find((p) => p.id === os.projeto_id) : undefined;
      const perf = perfis.find((p) => p.id === aloc.perfil_contratado_id);

      return {
        id: aloc.id,
        ordem_servico_id: aloc.ordem_servico_id,
        numero_os: os ? os.numero_os : 0,
        ano_referencia: os ? os.ano_referencia : 2026,
        mes_referencia: aloc.mes_referencia || 'JANEIRO',
        projeto_id: os ? os.projeto_id : 0,
        nome_projeto: proj ? proj.nome_projeto : 'Não vinculado',
        sigla_projeto: proj ? proj.sigla_projeto : 'N/D',
        sigla_secretaria: proj ? proj.sigla_secretaria : 'N/D',
        nome_secretaria: proj ? proj.nome_secretaria : 'N/D',
        perfil_contratado_id: aloc.perfil_contratado_id,
        nome_perfil: perf ? perf.nome_perfil : `Perfil #${aloc.perfil_contratado_id}`,
        nome_profissional: aloc.nome_profissional,
        percentual_alocacao: aloc.percentual_alocacao,
        custo_mensal_perfil: aloc.custo_mensal_perfil,
        custo_alocacao: aloc.custo_alocacao,
        documento_referencia: aloc.documento_referencia,
        ne_planejamento: os ? os.ne_planejamento : null,
        ne_faturamento: os ? os.ne_faturamento : null,
        processo_sei_pagamento: os ? os.processo_sei_pagamento : null,
      };
    });
  }, [alocacoes, ordensServico, projetos, perfis]);

  // Apply Top Filter Panel
  const alocacoesFiltradas = useMemo(() => {
    return alocacoesEnriquecidas.filter((item) => {
      if (filtroNumeroOs !== 'TODOS' && String(item.numero_os) !== filtroNumeroOs) return false;
      if (filtroProjeto !== 'TODOS' && String(item.projeto_id) !== filtroProjeto) return false;
      if (filtroAno !== 'TODOS' && String(item.ano_referencia) !== filtroAno) return false;
      if (filtroMes !== 'TODOS' && item.mes_referencia !== filtroMes) return false;
      if (filtroPerfil !== 'TODOS' && String(item.perfil_contratado_id) !== filtroPerfil) return false;
      if (filtroUnidadeProjeto !== 'TODOS' && item.sigla_projeto !== filtroUnidadeProjeto) return false;
      if (filtroSecretaria !== 'TODOS' && item.sigla_secretaria !== filtroSecretaria) return false;
      return true;
    });
  }, [
    alocacoesEnriquecidas,
    filtroNumeroOs,
    filtroProjeto,
    filtroAno,
    filtroMes,
    filtroPerfil,
    filtroUnidadeProjeto,
    filtroSecretaria,
  ]);

  const ordensServicoFiltradas = useMemo(() => {
    const osIds = new Set(alocacoesFiltradas.map((a) => a.ordem_servico_id));
    return ordensServico.filter((os) => osIds.has(os.id));
  }, [ordensServico, alocacoesFiltradas]);

  // 3. Calculated KPIs de Destaque
  // Indicador 1: Quantidade total de OSs
  const totalOrdensFiltradasCount = ordensServicoFiltradas.length;

  // Indicador 2: Valor Total Consolidado
  const totalValorConsolidado = useMemo(() => {
    return alocacoesFiltradas.reduce((acc, curr) => acc + (curr.custo_alocacao || 0), 0);
  }, [alocacoesFiltradas]);

  // Indicador 3: Total de profissionais alocados nas OSs
  const totalDesignacoesCount = alocacoesFiltradas.length;

  const mediaValorPorOs = useMemo(() => {
    if (totalOrdensFiltradasCount === 0) return 0;
    return totalValorConsolidado / totalOrdensFiltradasCount;
  }, [totalValorConsolidado, totalOrdensFiltradasCount]);

  const valorOsSelecionada = useMemo(() => {
    if (filtroNumeroOs === 'TODOS') return null;
    return totalValorConsolidado;
  }, [filtroNumeroOs, totalValorConsolidado]);

  const handleLimparFiltros = () => {
    setFiltroNumeroOs('TODOS');
    setFiltroProjeto('TODOS');
    setFiltroAno('TODOS');
    setFiltroMes('TODOS');
    setFiltroPerfil('TODOS');
    setFiltroUnidadeProjeto('TODOS');
    setFiltroSecretaria('TODOS');
    setTermoBuscaTabela('');
  };

  const isFiltroAtivo =
    filtroNumeroOs !== 'TODOS' ||
    filtroProjeto !== 'TODOS' ||
    filtroAno !== 'TODOS' ||
    filtroMes !== 'TODOS' ||
    filtroPerfil !== 'TODOS' ||
    filtroUnidadeProjeto !== 'TODOS' ||
    filtroSecretaria !== 'TODOS';

  // 4. Data for Gráfico 1 (Bar Chart: Quantidade de perfis alocados por Perfil)
  const barChartData = useMemo(() => {
    const profileCounts: { [nomePerfil: string]: number } = {};
    perfis.forEach((p) => {
      profileCounts[p.nome_perfil] = 0;
    });
    alocacoesFiltradas.forEach((aloc) => {
      profileCounts[aloc.nome_perfil] = (profileCounts[aloc.nome_perfil] || 0) + 1;
    });
    const labels = Object.keys(profileCounts).filter(
      (name) => filtroPerfil === 'TODOS' || profileCounts[name] > 0
    );
    const data = labels.map((l) => profileCounts[l]);
    return { labels, data };
  }, [alocacoesFiltradas, perfis, filtroPerfil]);

  // 5. Data for Gráfico 2 (Doughnut / Pie: Distribuição dos valores totais R$)
  const pieChartData = useMemo(() => {
    const valuesMap: { [key: string]: number } = {};

    if (pieAgrupamento === 'perfil') {
      alocacoesFiltradas.forEach((aloc) => {
        valuesMap[aloc.nome_perfil] = (valuesMap[aloc.nome_perfil] || 0) + aloc.custo_alocacao;
      });
    } else if (pieAgrupamento === 'os') {
      alocacoesFiltradas.forEach((aloc) => {
        const key = `OS #${aloc.numero_os} (${aloc.sigla_projeto})`;
        valuesMap[key] = (valuesMap[key] || 0) + aloc.custo_alocacao;
      });
    } else {
      alocacoesFiltradas.forEach((aloc) => {
        const key = aloc.sigla_secretaria || 'Outros';
        valuesMap[key] = (valuesMap[key] || 0) + aloc.custo_alocacao;
      });
    }

    const labels = Object.keys(valuesMap);
    const data = labels.map((l) => valuesMap[l]);
    return { labels, data };
  }, [alocacoesFiltradas, pieAgrupamento]);

  const chartPalette = [
    '#0d6efd',
    '#198754',
    '#fd7e14',
    '#6f42c1',
    '#0dcaf0',
    '#d63384',
    '#ffc107',
    '#20c997',
    '#6c757d',
    '#dc3545',
  ];

  // 6. Chart.js Effect for Bar Chart
  useEffect(() => {
    if (!barChartRef.current) return;
    if (barChartInstance.current) barChartInstance.current.destroy();

    const ctx = barChartRef.current.getContext('2d');
    if (!ctx) return;

    barChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: barChartData.labels,
        datasets: [
          {
            label: 'Profissionais / Alocações Designadas',
            data: barChartData.data,
            backgroundColor: barChartData.labels.map(
              (_, idx) => chartPalette[idx % chartPalette.length] + 'dd'
            ),
            borderColor: barChartData.labels.map(
              (_, idx) => chartPalette[idx % chartPalette.length]
            ),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.65,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                const total = barChartData.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${val} alocação(ões) (${pct}% do total)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 11, weight: 'bold' },
              color: '#475569',
              callback: function (val) {
                const label = this.getLabelForValue(val as number);
                return label.length > 22 ? label.substring(0, 20) + '...' : label;
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, color: '#64748b' },
            grid: { color: '#f1f5f9' },
          },
        },
      },
    });

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, [barChartData]);

  // 7. Chart.js Effect for Doughnut / Pie Chart
  useEffect(() => {
    if (!pieChartRef.current) return;
    if (pieChartInstance.current) pieChartInstance.current.destroy();

    const ctx = pieChartRef.current.getContext('2d');
    if (!ctx) return;

    pieChartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels: pieChartData.labels,
        datasets: [
          {
            data: pieChartData.data,
            backgroundColor: pieChartData.labels.map(
              (_, idx) => chartPalette[idx % chartPalette.length] + 'ee'
            ),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 14,
              padding: 10,
              font: { size: 11 },
              color: '#334155',
              generateLabels: (chart) => {
                const data = chart.data;
                if (!data.labels?.length || !data.datasets.length) return [];
                const dataset = data.datasets[0];
                const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);

                return data.labels.map((label, i) => {
                  const val = dataset.data[i] as number;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(0) : '0';
                  const shortLabel = String(label).length > 25 ? String(label).substring(0, 23) + '...' : label;
                  return {
                    text: `${shortLabel} (${pct}%)`,
                    fillStyle: (dataset.backgroundColor as string[])[i],
                    strokeStyle: '#ffffff',
                    lineWidth: 1,
                    index: i,
                  };
                });
              },
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                const total = pieChartData.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${formatCurrency(val)} (${pct}% do total)`;
              },
            },
          },
        },
        cutout: chartType === 'doughnut' ? '60%' : '0%',
      },
    });

    return () => {
      if (pieChartInstance.current) pieChartInstance.current.destroy();
    };
  }, [pieChartData, chartType]);

  // 8. Tabela com busca
  const itensTabelaFinal = useMemo(() => {
    if (!termoBuscaTabela.trim()) return alocacoesFiltradas;
    const query = termoBuscaTabela.toLowerCase().trim();
    return alocacoesFiltradas.filter((item) => {
      return (
        String(item.numero_os).includes(query) ||
        item.nome_profissional.toLowerCase().includes(query) ||
        item.nome_perfil.toLowerCase().includes(query) ||
        item.nome_projeto.toLowerCase().includes(query) ||
        item.sigla_projeto.toLowerCase().includes(query) ||
        item.sigla_secretaria.toLowerCase().includes(query) ||
        item.documento_referencia.toLowerCase().includes(query) ||
        (item.ne_planejamento && item.ne_planejamento.toLowerCase().includes(query)) ||
        (item.ne_faturamento && item.ne_faturamento.toLowerCase().includes(query)) ||
        (item.processo_sei_pagamento && item.processo_sei_pagamento.toLowerCase().includes(query))
      );
    });
  }, [alocacoesFiltradas, termoBuscaTabela]);

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'OS',
      'Ano',
      'Mês',
      'Secretaria',
      'Projeto',
      'Profissional',
      'Perfil',
      'Alocação (%)',
      'NE Planejamento (OS)',
      'NE Faturamento (OS)',
      'Processo SEI Pagamento (OS)',
      'Custo Base (R$)',
      'Custo Alocação (R$)',
      'Documento Ref.',
    ];

    const rows = itensTabelaFinal.map((item) => [
      item.numero_os,
      item.ano_referencia,
      item.mes_referencia,
      `"${item.sigla_secretaria}"`,
      `"${item.sigla_projeto}"`,
      `"${item.nome_profissional}"`,
      `"${item.nome_perfil}"`,
      item.percentual_alocacao,
      item.ne_planejamento ? `"${item.ne_planejamento}"` : '""',
      item.ne_faturamento ? `"${item.ne_faturamento}"` : '""',
      item.processo_sei_pagamento ? `"${item.processo_sei_pagamento}"` : '""',
      item.custo_mensal_perfil.toFixed(2),
      item.custo_alocacao.toFixed(2),
      `"${item.documento_referencia}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sisgos_alocacoes_custos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 py-1 px-2"
              onClick={onVoltarHub}
            >
              <i className="bi bi-arrow-left"></i>
              <span>Hub de Módulos</span>
            </button>
            <span className="text-muted">/</span>
            <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
              Módulo 2
            </span>
            <span className="text-muted small">Execução Financeira</span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Dashboard Analítico de Alocações & Custos</h2>
          <p className="text-muted mb-0 small">
            Visão gerencial e consolidação financeira das Ordens de Serviço, alocação de perfis e acompanhamento contratual.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2">
          {onNavigate && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => onNavigate('gestao-os')}
            >
              <i className="bi bi-clipboard2-check"></i>
              <span>Ir para Gestão de OSs</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleLimparFiltros}
            disabled={!isFiltroAtivo}
            title="Redefinir todos os filtros"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            <span>Limpar Filtros</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleExportCsv}
          >
            <i className="bi bi-file-earmark-spreadsheet"></i>
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Painel de Filtros no Topo */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <i className="bi bi-funnel-fill fs-6"></i>
            </div>
            <span className="fw-bold text-dark">Painel de Filtros Analíticos</span>
            {isFiltroAtivo && (
              <span className="badge bg-warning text-dark border border-warning-subtle">
                Filtros Ativos
              </span>
            )}
          </div>
          <div className="text-muted small">
            Exibindo <strong>{alocacoesFiltradas.length}</strong> designações em <strong>{totalOrdensFiltradasCount}</strong> OS(s)
          </div>
        </div>

        <div className="card-body p-3 bg-light-subtle">
          <div className="row g-3">
            {/* 1. Número da OS */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Número da OS
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroNumeroOs}
                onChange={(e) => setFiltroNumeroOs(e.target.value)}
              >
                <option value="TODOS">Todas as OSs</option>
                {listaNumerosOs.map((num) => (
                  <option key={num} value={String(num)}>
                    OS #{num}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Projeto */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Projeto
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroProjeto}
                onChange={(e) => setFiltroProjeto(e.target.value)}
              >
                <option value="TODOS">Todos os Projetos</option>
                {projetos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.sigla_projeto} - {p.nome_projeto.length > 25 ? p.nome_projeto.substring(0, 25) + '...' : p.nome_projeto}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Ano de Referência */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Ano de Referência
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
              >
                <option value="TODOS">Todos os Anos</option>
                {listaAnos.map((ano) => (
                  <option key={ano} value={String(ano)}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Mês de Referência */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Mês de Referência
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
              >
                <option value="TODOS">Todos os Meses</option>
                {MESES_REFERENCIA.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Perfil Profissional */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Perfil Profissional
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroPerfil}
                onChange={(e) => setFiltroPerfil(e.target.value)}
              >
                <option value="TODOS">Todos os Perfis</option>
                {perfis.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nome_perfil}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Unidade do Projeto */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Unidade do Projeto
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroUnidadeProjeto}
                onChange={(e) => setFiltroUnidadeProjeto(e.target.value)}
              >
                <option value="TODOS">Todas as Unidades</option>
                {listaUnidadesProjetos.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Secretaria Finalística */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <label className="form-label small fw-bold text-secondary mb-1">
                Secretaria Finalística
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroSecretaria}
                onChange={(e) => setFiltroSecretaria(e.target.value)}
              >
                <option value="TODOS">Todas as Secretarias</option>
                {listaSecretarias.map(({ sigla, nome }) => (
                  <option key={sigla} value={sigla}>
                    {sigla} ({nome})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Indicadores de Destaque Obrigatórios */}
      <div className="row g-3 mb-4">
        {/* Indicador 1: Quantidade total de OSs */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Quantidade total de OSs
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {totalOrdensFiltradasCount}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      / {ordensServico.length} no banco
                    </span>
                  </h3>
                  <small className="text-primary fw-medium">
                    {totalOrdensFiltradasCount > 0
                      ? `${((totalOrdensFiltradasCount / ordensServico.length) * 100).toFixed(0)}% do volume total`
                      : 'Nenhuma OS'}
                  </small>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-3">
                  <i className="bi bi-file-earmark-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 2: Valor Total Consolidado */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Valor Total Consolidado
                  </span>
                  <h3 className="fw-bold text-success mb-0 mt-1 font-monospace">
                    {formatCurrency(totalValorConsolidado)}
                  </h3>
                  <small className="text-muted">
                    Soma de todas as alocações ativas
                  </small>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-3">
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 3: Total de profissionais alocados nas OSs */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Total de Alocados nas OSs
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {totalDesignacoesCount}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      alocações
                    </span>
                  </h3>
                  <small className="text-info fw-medium">
                    Profissionais alocados nas OSs
                  </small>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador Auxiliar: Valor da OS Selecionada ou Média */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    {valorOsSelecionada !== null ? `Valor da OS #${filtroNumeroOs}` : 'Média por OS'}
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1 font-monospace">
                    {formatCurrency(valorOsSelecionada !== null ? valorOsSelecionada : mediaValorPorOs)}
                  </h3>
                  <small className="text-muted">
                    {valorOsSelecionada !== null
                      ? 'Total específico da OS selecionada'
                      : `Média entre as ${totalOrdensFiltradasCount} OSs`}
                  </small>
                </div>
                <div className="bg-warning-subtle text-warning p-3 rounded-3">
                  <i className="bi bi-pie-chart-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Seção de Gráficos (Chart.js) */}
      <div className="row g-3 mb-4">
        {/* Gráfico 1: Quantidade de perfis alocados por Perfil */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-bar-chart-fill text-primary"></i>
                  Quantidade de Perfis Alocados por Perfil
                </span>
                <small className="text-muted">
                  Volume de profissionais designados em cada categoria profissional
                </small>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                Gráfico de Barras
              </span>
            </div>

            <div className="card-body p-3">
              {alocacoesFiltradas.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Nenhum dado encontrado para os filtros selecionados.
                </div>
              ) : (
                <div style={{ height: '320px', position: 'relative' }}>
                  <canvas ref={barChartRef}></canvas>
                </div>
              )}
            </div>

            <div className="card-footer bg-light py-2 px-3 text-muted small d-flex justify-content-between">
              <span>Total no recorte: <strong>{totalDesignacoesCount}</strong> alocações</span>
              <span>Classificação: <strong>{barChartData.labels.length}</strong> perfis ativos</span>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Distribuição dos valores totais R$ por Perfil / OS */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-pie-chart-fill text-success"></i>
                  Distribuição de Custos (R$)
                </span>
                <small className="text-muted">
                  Valores financeiros consolidados por agrupamento analítico
                </small>
              </div>

              {/* Toggles: Agrupamento & Chart Type */}
              <div className="d-flex align-items-center gap-2">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${pieAgrupamento === 'perfil' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPieAgrupamento('perfil')}
                  >
                    Por Perfil
                  </button>
                  <button
                    type="button"
                    className={`btn ${pieAgrupamento === 'os' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPieAgrupamento('os')}
                  >
                    Por OS
                  </button>
                  <button
                    type="button"
                    className={`btn ${pieAgrupamento === 'secretaria' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPieAgrupamento('secretaria')}
                  >
                    Por Sec.
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm px-2"
                  title={chartType === 'doughnut' ? 'Mudar para Gráfico de Pizza' : 'Mudar para Gráfico de Rosca'}
                  onClick={() => setChartType(chartType === 'doughnut' ? 'pie' : 'doughnut')}
                >
                  <i className={`bi ${chartType === 'doughnut' ? 'bi-circle' : 'bi-pie-chart'}`}></i>
                </button>
              </div>
            </div>

            <div className="card-body p-3">
              {alocacoesFiltradas.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Nenhum custo registrado para o recorte selecionado.
                </div>
              ) : (
                <div style={{ height: '320px', position: 'relative' }}>
                  <canvas ref={pieChartRef}></canvas>
                </div>
              )}
            </div>

            <div className="card-footer bg-light py-2 px-3 text-muted small d-flex justify-content-between">
              <span>Agrupamento atual: <strong className="text-uppercase">{pieAgrupamento}</strong></span>
              <span className="text-success fw-bold font-monospace">
                Total: {formatCurrency(totalValorConsolidado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabela com a lista de designações da equipe por OS */}
      <div className="card border-0 shadow-sm bg-white">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-dark fs-6">
                Detalhamento Analítico das Alocações & Custos
              </span>
              <span className="badge bg-primary text-white rounded-pill px-2">
                {itensTabelaFinal.length} registros
              </span>
            </div>
            <small className="text-muted">
              Visão transacional com cruzamento de Ordens de Serviço, NEs e Processo SEI
            </small>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ maxWidth: 360 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0 shadow-none"
                placeholder="Buscar profissional, OS, NE, SEI..."
                value={termoBuscaTabela}
                onChange={(e) => setTermoBuscaTabela(e.target.value)}
              />
              {termoBuscaTabela && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setTermoBuscaTabela('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th style={{ width: '90px' }}>OS</th>
                <th style={{ width: '80px' }}>Ano</th>
                <th style={{ width: '100px' }}>Mês</th>
                <th style={{ width: '140px' }}>Projeto / Sec.</th>
                <th>Profissional Designado</th>
                <th>Perfil Contratado</th>
                <th className="text-center" style={{ width: '110px' }}>Alocação (%)</th>
                <th style={{ width: '120px' }}>NE Planej. (OS)</th>
                <th style={{ width: '120px' }}>NE Fatur. (OS)</th>
                <th style={{ width: '130px' }}>Proc. SEI (OS)</th>
                <th className="text-end" style={{ width: '120px' }}>Custo Base</th>
                <th className="text-end" style={{ width: '130px' }}>Custo Alocação (R$)</th>
                <th style={{ width: '130px' }}>Doc. Ref.</th>
              </tr>
            </thead>
            <tbody className="small">
              {itensTabelaFinal.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-5 text-muted">
                    <i className="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    Nenhuma alocação encontrada com os filtros e busca aplicados.
                  </td>
                </tr>
              ) : (
                itensTabelaFinal.map((item) => (
                  <tr key={item.id}>
                    {/* OS */}
                    <td>
                      <span className="badge bg-light text-dark border font-monospace">
                        OS #{item.numero_os}
                      </span>
                    </td>

                    {/* Ano */}
                    <td className="text-muted">{item.ano_referencia}</td>

                    {/* Mês */}
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {item.mes_referencia}
                      </span>
                    </td>

                    {/* Projeto / Sec. */}
                    <td>
                      <div className="fw-semibold text-dark">{item.sigla_projeto}</div>
                      <small className="text-muted">{item.sigla_secretaria}</small>
                    </td>

                    {/* Profissional */}
                    <td>
                      <div className="fw-semibold text-dark">{item.nome_profissional}</div>
                    </td>

                    {/* Perfil Contratado */}
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {item.nome_perfil}
                      </span>
                    </td>

                    {/* Alocação % */}
                    <td className="text-center">
                      <span
                        className={`badge ${
                          item.percentual_alocacao === 100
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-info-subtle text-info border border-info-subtle'
                        } fw-bold`}
                      >
                        {formatPercent(item.percentual_alocacao)}
                      </span>
                    </td>

                    {/* NE Planejamento */}
                    <td>
                      {item.ne_planejamento ? (
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace small">
                          <i className="bi bi-file-earmark-text me-1"></i>
                          {item.ne_planejamento}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    {/* NE Faturamento */}
                    <td>
                      {item.ne_faturamento ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace small">
                          <i className="bi bi-receipt-cutoff me-1"></i>
                          {item.ne_faturamento}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    {/* Processo SEI Pagamento */}
                    <td>
                      {item.processo_sei_pagamento ? (
                        <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle font-monospace small">
                          <i className="bi bi-folder2-open me-1"></i>
                          {item.processo_sei_pagamento}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>

                    {/* Custo Base */}
                    <td className="text-end font-monospace text-muted">
                      {formatCurrency(item.custo_mensal_perfil)}
                    </td>

                    {/* Custo Alocação */}
                    <td className="text-end font-monospace fw-bold text-dark">
                      {formatCurrency(item.custo_alocacao)}
                    </td>

                    {/* Doc. Ref. */}
                    <td>
                      <span className="text-muted font-monospace small">
                        {item.documento_referencia || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {itensTabelaFinal.length > 0 && (
              <tfoot className="table-light fw-bold small">
                <tr>
                  <td colSpan={6} className="text-end">Total Geral Filtrado:</td>
                  <td className="text-center text-primary">
                    {formatPercent(
                      itensTabelaFinal.reduce((a, c) => a + c.percentual_alocacao, 0) /
                        itensTabelaFinal.length
                    )}{' '}
                    (média)
                  </td>
                  <td colSpan={4}></td>
                  <td className="text-end text-success font-monospace fs-6">
                    {formatCurrency(totalValorConsolidado)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
