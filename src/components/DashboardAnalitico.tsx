import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSisgos } from '../context/SisgosContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { MESES_REFERENCIA, MesReferencia } from '../types/models';
import { ActiveTab } from './Navbar';

// Register all Chart.js controllers, scales and elements
Chart.register(...registerables);

interface DashboardAnaliticoProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const DashboardAnalitico: React.FC<DashboardAnaliticoProps> = ({ onNavigate }) => {
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

  // Table search & pagination
  const [termoBuscaTabela, setTermoBuscaTabela] = useState<string>('');

  // 1. Dynamic lists for filter selects
  const listaNumerosOs = useMemo(() => {
    const nums = Array.from(new Set(ordensServico.map((os) => os.numero_os))).sort((a, b) => a - b);
    return nums;
  }, [ordensServico]);

  const listaAnos = useMemo(() => {
    const anos = Array.from(new Set(ordensServico.map((os) => os.ano_referencia))).sort((a, b) => b - a);
    return anos;
  }, [ordensServico]);

  const listaUnidadesProjetos = useMemo(() => {
    const siglas = Array.from(new Set(projetos.map((p) => p.sigla_projeto))).sort();
    return siglas;
  }, [projetos]);

  const listaSecretarias = useMemo(() => {
    const secMap = new Map<string, string>();
    projetos.forEach((p) => {
      secMap.set(p.sigla_secretaria, p.nome_secretaria);
    });
    return Array.from(secMap.entries()).map(([sigla, nome]) => ({ sigla, nome }));
  }, [projetos]);

  // 2. Core Filter Logic: Joined Allocations with OS and Project info
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
      };
    });
  }, [alocacoes, ordensServico, projetos, perfis]);

  // Apply Top Filter Panel
  const alocacoesFiltradas = useMemo(() => {
    return alocacoesEnriquecidas.filter((item) => {
      // 1. Número da OS
      if (filtroNumeroOs !== 'TODOS' && String(item.numero_os) !== filtroNumeroOs) {
        return false;
      }
      // 2. Projeto
      if (filtroProjeto !== 'TODOS' && String(item.projeto_id) !== filtroProjeto) {
        return false;
      }
      // 3. Ano de Referência
      if (filtroAno !== 'TODOS' && String(item.ano_referencia) !== filtroAno) {
        return false;
      }
      // 4. Mês de Referência
      if (filtroMes !== 'TODOS' && item.mes_referencia !== filtroMes) {
        return false;
      }
      // 5. Perfil Profissional
      if (filtroPerfil !== 'TODOS' && String(item.perfil_contratado_id) !== filtroPerfil) {
        return false;
      }
      // 6. Unidade do Projeto (Sigla do Projeto)
      if (filtroUnidadeProjeto !== 'TODOS' && item.sigla_projeto !== filtroUnidadeProjeto) {
        return false;
      }
      // 7. Secretaria Finalística
      if (filtroSecretaria !== 'TODOS' && item.sigla_secretaria !== filtroSecretaria) {
        return false;
      }
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

  // Distinct OSs in filtered allocations
  const ordensServicoFiltradas = useMemo(() => {
    const osIds = new Set(alocacoesFiltradas.map((a) => a.ordem_servico_id));
    return ordensServico.filter((os) => osIds.has(os.id));
  }, [ordensServico, alocacoesFiltradas]);

  // 3. Calculated KPIs
  const totalValorConsolidado = useMemo(() => {
    return alocacoesFiltradas.reduce((acc, curr) => acc + (curr.custo_alocacao || 0), 0);
  }, [alocacoesFiltradas]);

  const totalOrdensFiltradasCount = ordensServicoFiltradas.length;
  const totalDesignacoesCount = alocacoesFiltradas.length;

  const mediaValorPorOs = useMemo(() => {
    if (totalOrdensFiltradasCount === 0) return 0;
    return totalValorConsolidado / totalOrdensFiltradasCount;
  }, [totalValorConsolidado, totalOrdensFiltradasCount]);

  // Selected OS total (if filtering by specific OS)
  const valorOsSelecionada = useMemo(() => {
    if (filtroNumeroOs === 'TODOS') return null;
    return totalValorConsolidado;
  }, [filtroNumeroOs, totalValorConsolidado]);

  // Reset all filters
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

    // Initialize all existing profiles with 0 so all appear or just those with data
    perfis.forEach((p) => {
      profileCounts[p.nome_perfil] = 0;
    });

    alocacoesFiltradas.forEach((aloc) => {
      profileCounts[aloc.nome_perfil] = (profileCounts[aloc.nome_perfil] || 0) + 1;
    });

    // Filter out 0s if specific profile filter is applied, or keep active
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
      // secretaria
      alocacoesFiltradas.forEach((aloc) => {
        const key = aloc.sigla_secretaria || 'Outros';
        valuesMap[key] = (valuesMap[key] || 0) + aloc.custo_alocacao;
      });
    }

    const labels = Object.keys(valuesMap);
    const data = labels.map((l) => valuesMap[l]);

    return { labels, data };
  }, [alocacoesFiltradas, pieAgrupamento]);

  // Color Palette for BI charts
  const chartPalette = [
    '#0d6efd', // Primary Blue
    '#198754', // Success Green
    '#fd7e14', // Orange
    '#6f42c1', // Indigo/Purple
    '#0dcaf0', // Info Cyan
    '#d63384', // Pink
    '#ffc107', // Yellow
    '#20c997', // Teal
    '#6c757d', // Gray
    '#dc3545', // Danger Red
  ];

  // 6. Chart.js Effect for Bar Chart (Gráfico 1)
  useEffect(() => {
    if (!barChartRef.current) return;

    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

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
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
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
              maxRotation: 30,
              minRotation: 0,
              callback: function (val, index) {
                const label = this.getLabelForValue(val as number);
                return label.length > 22 ? label.substring(0, 20) + '...' : label;
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 11 },
              color: '#64748b',
            },
            grid: {
              color: '#f1f5f9',
            },
          },
        },
      },
    });

    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [barChartData]);

  // 7. Chart.js Effect for Doughnut / Pie Chart (Gráfico 2)
  useEffect(() => {
    if (!pieChartRef.current) return;

    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }

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
            cornerRadius: 8,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
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
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
    };
  }, [pieChartData, chartType]);

  // 8. Filtered Table rows (with text search)
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
        item.documento_referencia.toLowerCase().includes(query)
      );
    });
  }, [alocacoesFiltradas, termoBuscaTabela]);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary text-white px-2 py-1 fw-bold">
              <i className="bi bi-bar-chart-line-fill me-1"></i>
              BI & Data Visualization
            </span>
            <span className="badge bg-light text-dark border">Chart.js Engine</span>
            <span className="badge bg-light text-dark border">Bootstrap 5</span>
            <span className="text-muted small">Alocações e Custos</span>
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
            title="Redefinir todos os filtros para o padrão"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            <span>Limpar Filtros</span>
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

      {/* 2. KPIs no Topo */}
      <div className="row g-3 mb-4">
        {/* KPI 1: Total de OSs */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Total de OSs Filtradas
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

        {/* KPI 2: Valor Total Consolidado (R$) */}
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

        {/* KPI 3: Total de Designações da Equipe */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Designações de Equipe
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

        {/* KPI 4: Valor da OS Selecionada ou Média */}
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
                <i className="bi bi-table text-primary me-2"></i>
                Designações da Equipe por Ordem de Serviço
              </span>
              <span className="badge bg-secondary-subtle text-secondary border">
                {itensTabelaFinal.length} registros
              </span>
            </div>
            <small className="text-muted">
              Relação detalhada de profissionais, percentuais de dedicação e custos apurados
            </small>
          </div>

          {/* Quick search input */}
          <div className="d-flex align-items-center gap-2" style={{ maxWidth: 320 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar profissional, projeto..."
                value={termoBuscaTabela}
                onChange={(e) => setTermoBuscaTabela(e.target.value)}
              />
              {termoBuscaTabela && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setTermoBuscaTabela('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: '460px' }}>
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                <tr className="small text-secondary text-uppercase">
                  <th style={{ width: '120px' }}>OS / Ref.</th>
                  <th>Projeto & Secretaria</th>
                  <th>Profissional Designado</th>
                  <th>Perfil Contratado</th>
                  <th className="text-center" style={{ width: '130px' }}>Alocação (%)</th>
                  <th className="text-end" style={{ width: '140px' }}>Custo Base</th>
                  <th className="text-end" style={{ width: '150px' }}>Custo Alocação (R$)</th>
                  <th style={{ width: '150px' }}>Doc. Ref.</th>
                </tr>
              </thead>
              <tbody className="small">
                {itensTabelaFinal.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5 text-muted">
                      <i className="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      Nenhuma alocação encontrada com os filtros e busca aplicados.
                    </td>
                  </tr>
                ) : (
                  itensTabelaFinal.map((item) => (
                    <tr key={item.id}>
                      {/* OS / Ref */}
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold d-block mb-1 text-center">
                          OS #{item.numero_os}
                        </span>
                        <small className="text-muted d-block text-center" style={{ fontSize: '11px' }}>
                          {item.mes_referencia.substring(0, 3)}/{item.ano_referencia}
                        </small>
                      </td>

                      {/* Projeto & Secretaria */}
                      <td>
                        <div className="fw-semibold text-dark">{item.sigla_projeto}</div>
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: 220 }}>
                          {item.nome_projeto}
                        </small>
                        <span className="badge bg-secondary-subtle text-secondary border px-1" style={{ fontSize: '10px' }}>
                          {item.sigla_secretaria}
                        </span>
                      </td>

                      {/* Profissional */}
                      <td>
                        <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                          <i className="bi bi-person text-secondary"></i>
                          <span>{item.nome_profissional}</span>
                        </div>
                      </td>

                      {/* Perfil Contratado */}
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.nome_perfil}
                        </span>
                      </td>

                      {/* Alocação % */}
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '60px' }}>
                            <div
                              className="progress-bar bg-info"
                              role="progressbar"
                              style={{ width: `${item.percentual_alocacao}%` }}
                              aria-valuenow={item.percentual_alocacao}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <span className="fw-bold font-monospace">{item.percentual_alocacao}%</span>
                        </div>
                      </td>

                      {/* Custo Base */}
                      <td className="text-end font-monospace text-muted">
                        {formatCurrency(item.custo_mensal_perfil)}
                      </td>

                      {/* Custo Alocação */}
                      <td className="text-end font-monospace fw-bold text-success">
                        {formatCurrency(item.custo_alocacao)}
                      </td>

                      {/* Doc Referencia */}
                      <td>
                        <small className="text-muted text-truncate d-block" style={{ maxWidth: 140 }}>
                          {item.documento_referencia || '—'}
                        </small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="table-light border-top border-2">
                <tr className="fw-bold">
                  <td colSpan={4} className="text-uppercase text-secondary small py-3">
                    Totalização das Alocações Filtradas ({itensTabelaFinal.length} registros)
                  </td>
                  <td className="text-center small py-3 font-monospace">
                    {itensTabelaFinal.length > 0
                      ? `${(
                          itensTabelaFinal.reduce((a, b) => a + b.percentual_alocacao, 0) /
                          itensTabelaFinal.length
                        ).toFixed(0)}% méd.`
                      : '—'}
                  </td>
                  <td className="text-end small py-3 text-muted font-monospace">
                    Subtotal:
                  </td>
                  <td className="text-end py-3 text-success fs-6 font-monospace">
                    {formatCurrency(
                      itensTabelaFinal.reduce((acc, curr) => acc + curr.custo_alocacao, 0)
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
