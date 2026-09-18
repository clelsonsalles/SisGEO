import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSisgos } from '../../context/SisgosContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { FiltroMultiplaSelecao, OpcaoFiltro } from './FiltroMultiplaSelecao';

Chart.register(...registerables);

interface ModuloProjetosUnidadesProps {
  onVoltarHub: () => void;
}

export const ModuloProjetosUnidades: React.FC<ModuloProjetosUnidadesProps> = ({ onVoltarHub }) => {
  const { ordensServico, projetos, alocacoes } = useSisgos();

  // Canvas refs for Chart.js
  const custoBarChartRef = useRef<HTMLCanvasElement | null>(null);
  const osDoughnutChartRef = useRef<HTMLCanvasElement | null>(null);
  const equipeBarChartRef = useRef<HTMLCanvasElement | null>(null);

  // Instances of Chart.js
  const custoBarInstance = useRef<Chart | null>(null);
  const osDoughnutInstance = useRef<Chart | null>(null);
  const equipeBarInstance = useRef<Chart | null>(null);

  // Filtros com MÚLTIPLA SELEÇÃO
  const [filtroSecretarias, setFiltroSecretarias] = useState<string[]>([]);
  const [filtroProjetos, setFiltroProjetos] = useState<string[]>([]);
  const [filtroAnos, setFiltroAnos] = useState<string[]>([]);
  const [filtroSituacoesSgc, setFiltroSituacoesSgc] = useState<string[]>([]);
  const [filtroSituacoesPassivo, setFiltroSituacoesPassivo] = useState<string[]>([]);

  // Alternadores de visualização de gráficos
  const [agrupamentoCusto, setAgrupamentoCusto] = useState<'projeto' | 'secretaria'>('projeto');
  const [agrupamentoOs, setAgrupamentoOs] = useState<'secretaria' | 'projeto'>('secretaria');

  // Busca na tabela
  const [termoBusca, setTermoBusca] = useState<string>('');

  // 1. Opções dinâmicas para selects de filtro com múltipla seleção
  const opcoesSecretarias: OpcaoFiltro[] = useMemo(() => {
    const secMap = new Map<string, string>();
    projetos.forEach((p) => {
      secMap.set(p.sigla_secretaria.trim().toUpperCase(), p.nome_secretaria.trim());
    });
    return Array.from(secMap.entries()).map(([sigla, nome]) => ({
      value: sigla,
      label: sigla,
      sublabel: nome,
    }));
  }, [projetos]);

  const opcoesProjetos: OpcaoFiltro[] = useMemo(() => {
    let projs = projetos;
    if (filtroSecretarias.length > 0) {
      projs = projs.filter((p) => filtroSecretarias.includes(p.sigla_secretaria.trim().toUpperCase()));
    }
    return projs.map((p) => ({
      value: String(p.id),
      label: p.sigla_projeto || p.nome_projeto,
      sublabel: p.sigla_secretaria,
    }));
  }, [projetos, filtroSecretarias]);

  const opcoesAnos: OpcaoFiltro[] = useMemo(() => {
    const anos = Array.from(new Set(ordensServico.map((os) => os.ano_referencia))).sort((a, b) => b - a);
    return anos.map((ano) => ({
      value: String(ano),
      label: String(ano),
    }));
  }, [ordensServico]);

  const opcoesSituacoesSgc: OpcaoFiltro[] = useMemo(() => {
    const situacoes = Array.from(new Set(ordensServico.map((os) => (os.situacao_sgc || '').trim()).filter(Boolean))).sort();
    return situacoes.map((sit) => ({
      value: sit,
      label: sit,
    }));
  }, [ordensServico]);

  const opcoesSituacoesPassivo: OpcaoFiltro[] = useMemo(() => {
    const situacoes = Array.from(new Set(ordensServico.map((os) => (os.situacao_passivo_2026 || '').trim()).filter(Boolean))).sort();
    return situacoes.map((sit) => ({
      value: sit,
      label: sit,
    }));
  }, [ordensServico]);

  const handleLimparFiltros = () => {
    setFiltroSecretarias([]);
    setFiltroProjetos([]);
    setFiltroAnos([]);
    setFiltroSituacoesSgc([]);
    setFiltroSituacoesPassivo([]);
    setTermoBusca('');
  };

  const isFiltroAtivo =
    filtroSecretarias.length > 0 ||
    filtroProjetos.length > 0 ||
    filtroAnos.length > 0 ||
    filtroSituacoesSgc.length > 0 ||
    filtroSituacoesPassivo.length > 0;

  // 2. Filtragem e junção dos dados de Projetos, OSs e Alocações
  const dadosProjetosConsolidados = useMemo(() => {
    return projetos
      .filter((proj) => {
        if (filtroSecretarias.length > 0 && !filtroSecretarias.includes(proj.sigla_secretaria.trim().toUpperCase())) {
          return false;
        }
        if (filtroProjetos.length > 0 && !filtroProjetos.includes(String(proj.id))) {
          return false;
        }
        return true;
      })
      .map((proj) => {
        // OSs deste projeto que atendem aos filtros de OS
        const ossDoProjeto = ordensServico.filter((os) => {
          if (os.projeto_id !== proj.id) return false;
          if (filtroAnos.length > 0 && !filtroAnos.includes(String(os.ano_referencia))) return false;
          if (filtroSituacoesSgc.length > 0 && (!os.situacao_sgc || !filtroSituacoesSgc.includes(os.situacao_sgc))) return false;
          if (filtroSituacoesPassivo.length > 0 && (!os.situacao_passivo_2026 || !filtroSituacoesPassivo.includes(os.situacao_passivo_2026))) return false;
          return true;
        });

        const osIds = new Set(ossDoProjeto.map((os) => os.id));
        const alocacoesDoProjeto = alocacoes.filter((a) => osIds.has(a.ordem_servico_id));
        const custoTotalProjeto = alocacoesDoProjeto.reduce((acc, a) => acc + (a.custo_alocacao || 0), 0);
        const totalAlocacoes = alocacoesDoProjeto.length;
        const profissionaisUnicos = new Set(
          alocacoesDoProjeto.map((a) => a.nome_profissional?.trim().toLowerCase()).filter(Boolean)
        ).size;

        const mediaPorOs = ossDoProjeto.length > 0 ? custoTotalProjeto / ossDoProjeto.length : 0;

        return {
          id: proj.id,
          sigla_projeto: proj.sigla_projeto,
          nome_projeto: proj.nome_projeto,
          sigla_secretaria: proj.sigla_secretaria,
          nome_secretaria: proj.nome_secretaria,
          oss: ossDoProjeto,
          qtd_oss: ossDoProjeto.length,
          alocacoes: alocacoesDoProjeto,
          total_alocacoes: totalAlocacoes,
          profissionais_unicos: profissionaisUnicos,
          custo_total: custoTotalProjeto,
          custo_medio_por_os: mediaPorOs,
        };
      })
      // Se houver filtro de OS (ano ou situação), filtramos projetos que tenham OSs no escopo
      .filter((item) => {
        if (filtroAnos.length > 0 || filtroSituacoesSgc.length > 0 || filtroSituacoesPassivo.length > 0) {
          return item.qtd_oss > 0;
        }
        return true;
      });
  }, [
    projetos,
    ordensServico,
    alocacoes,
    filtroSecretarias,
    filtroProjetos,
    filtroAnos,
    filtroSituacoesSgc,
    filtroSituacoesPassivo,
  ]);

  // 3. Indicadores de Destaque
  // Indicador 1: Quantidade de Projetos
  const totalProjetosFiltrados = dadosProjetosConsolidados.length;

  // Indicador 2: Quantidade de Secretarias
  const totalSecretariasFiltradas = useMemo(() => {
    const secSet = new Set(dadosProjetosConsolidados.map((d) => d.sigla_secretaria.trim().toUpperCase()));
    return secSet.size;
  }, [dadosProjetosConsolidados]);

  // Indicador 3: Custo Médio das OSs Mensais dos Projetos
  const custoTotalFiltrado = useMemo(() => {
    return dadosProjetosConsolidados.reduce((acc, curr) => acc + curr.custo_total, 0);
  }, [dadosProjetosConsolidados]);

  const totalOssFiltradas = useMemo(() => {
    return dadosProjetosConsolidados.reduce((acc, curr) => acc + curr.qtd_oss, 0);
  }, [dadosProjetosConsolidados]);

  const custoMedioOssMensais = totalOssFiltradas > 0 ? custoTotalFiltrado / totalOssFiltradas : 0;

  const totalAlocacoesEquipe = useMemo(() => {
    return dadosProjetosConsolidados.reduce((acc, curr) => acc + curr.total_alocacoes, 0);
  }, [dadosProjetosConsolidados]);

  // Paleta de cores para gráficos
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

  // 4. Gráfico 1: Custos Totais por Projeto / Secretaria (Chart.js)
  const dadosGraficoCusto = useMemo(() => {
    if (agrupamentoCusto === 'projeto') {
      const labels = dadosProjetosConsolidados.map((p) => p.sigla_projeto);
      const data = dadosProjetosConsolidados.map((p) => p.custo_total);
      return { labels, data, titulo: 'Custo Total por Projeto (R$)' };
    } else {
      const secMap: { [sec: string]: number } = {};
      dadosProjetosConsolidados.forEach((p) => {
        secMap[p.sigla_secretaria] = (secMap[p.sigla_secretaria] || 0) + p.custo_total;
      });
      const labels = Object.keys(secMap);
      const data = labels.map((l) => secMap[l]);
      return { labels, data, titulo: 'Custo Total por Secretaria (R$)' };
    }
  }, [dadosProjetosConsolidados, agrupamentoCusto]);

  useEffect(() => {
    if (!custoBarChartRef.current) return;
    if (custoBarInstance.current) {
      custoBarInstance.current.destroy();
    }
    const ctx = custoBarChartRef.current.getContext('2d');
    if (!ctx) return;

    custoBarInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dadosGraficoCusto.labels,
        datasets: [
          {
            label: 'Custo Total (R$)',
            data: dadosGraficoCusto.data,
            backgroundColor: dadosGraficoCusto.labels.map(
              (_, i) => chartPalette[i % chartPalette.length] + 'cc'
            ),
            borderColor: dadosGraficoCusto.labels.map(
              (_, i) => chartPalette[i % chartPalette.length]
            ),
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: (context) => ` Custo: ${formatCurrency(context.raw as number)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => formatCurrency(val as number),
              font: { size: 10 },
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: 'bold' } },
          },
        },
      },
    });

    return () => {
      if (custoBarInstance.current) custoBarInstance.current.destroy();
    };
  }, [dadosGraficoCusto]);

  // 5. Gráfico 2: Quantidade de OSs por Secretaria / Projeto
  const dadosGraficoOs = useMemo(() => {
    if (agrupamentoOs === 'secretaria') {
      const secMap: { [sec: string]: number } = {};
      dadosProjetosConsolidados.forEach((p) => {
        secMap[p.sigla_secretaria] = (secMap[p.sigla_secretaria] || 0) + p.qtd_oss;
      });
      const labels = Object.keys(secMap);
      const data = labels.map((l) => secMap[l]);
      return { labels, data };
    } else {
      const labels = dadosProjetosConsolidados.map((p) => p.sigla_projeto);
      const data = dadosProjetosConsolidados.map((p) => p.qtd_oss);
      return { labels, data };
    }
  }, [dadosProjetosConsolidados, agrupamentoOs]);

  useEffect(() => {
    if (!osDoughnutChartRef.current) return;
    if (osDoughnutInstance.current) {
      osDoughnutInstance.current.destroy();
    }
    const ctx = osDoughnutChartRef.current.getContext('2d');
    if (!ctx) return;

    osDoughnutInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dadosGraficoOs.labels,
        datasets: [
          {
            data: dadosGraficoOs.data,
            backgroundColor: dadosGraficoOs.labels.map(
              (_, i) => chartPalette[i % chartPalette.length] + 'ee'
            ),
            borderColor: '#ffffff',
            borderWidth: 2,
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
              boxWidth: 12,
              padding: 10,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: (context) => ` ${context.raw} OS(s) registrada(s)`,
            },
          },
        },
        cutout: '60%',
      },
    });

    return () => {
      if (osDoughnutInstance.current) osDoughnutInstance.current.destroy();
    };
  }, [dadosGraficoOs]);

  // 6. Gráfico 3: Alocação de Equipe por Projeto
  const dadosGraficoEquipe = useMemo(() => {
    const labels = dadosProjetosConsolidados.map((p) => p.sigla_projeto);
    const dataAlocacoes = dadosProjetosConsolidados.map((p) => p.total_alocacoes);
    const dataProfissionais = dadosProjetosConsolidados.map((p) => p.profissionais_unicos);
    return { labels, dataAlocacoes, dataProfissionais };
  }, [dadosProjetosConsolidados]);

  useEffect(() => {
    if (!equipeBarChartRef.current) return;
    if (equipeBarInstance.current) {
      equipeBarInstance.current.destroy();
    }
    const ctx = equipeBarChartRef.current.getContext('2d');
    if (!ctx) return;

    equipeBarInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dadosGraficoEquipe.labels,
        datasets: [
          {
            label: 'Designações / Alocações',
            data: dadosGraficoEquipe.dataAlocacoes,
            backgroundColor: '#0d6efdcc',
            borderColor: '#0d6efd',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Profissionais Distintos',
            data: dadosGraficoEquipe.dataProfissionais,
            backgroundColor: '#198754cc',
            borderColor: '#198754',
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: 'bold' } },
          },
        },
      },
    });

    return () => {
      if (equipeBarInstance.current) equipeBarInstance.current.destroy();
    };
  }, [dadosGraficoEquipe]);

  // 7. Tabela final filtrada por busca textual
  const tabelaFinal = useMemo(() => {
    if (!termoBusca.trim()) return dadosProjetosConsolidados;
    const query = termoBusca.toLowerCase().trim();
    return dadosProjetosConsolidados.filter((item) => {
      return (
        item.sigla_projeto.toLowerCase().includes(query) ||
        item.nome_projeto.toLowerCase().includes(query) ||
        item.sigla_secretaria.toLowerCase().includes(query) ||
        item.nome_secretaria.toLowerCase().includes(query)
      );
    });
  }, [dadosProjetosConsolidados, termoBusca]);

  // Exportar CSV da tabela de Projetos & Unidades
  const handleExportCsv = () => {
    const headers = [
      'Secretaria Sigla',
      'Secretaria Nome',
      'Projeto Sigla',
      'Projeto Nome',
      'Quantidade de OSs',
      'Designações de Equipe',
      'Profissionais Únicos',
      'Custo Total Alocado (R$)',
      'Custo Médio por OS (R$)',
    ];

    const rows = tabelaFinal.map((item) => [
      `"${item.sigla_secretaria}"`,
      `"${item.nome_secretaria}"`,
      `"${item.sigla_projeto}"`,
      `"${item.nome_projeto.replace(/"/g, '""')}"`,
      item.qtd_oss,
      item.total_alocacoes,
      item.profissionais_unicos,
      item.custo_total.toFixed(2),
      item.custo_medio_por_os.toFixed(2),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sisgos_analise_projetos_unidades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Top Header com Botão Voltar */}
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
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">
              Módulo 1
            </span>
            <span className="text-muted small">Demandas & Secretarias</span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Visão Analítica de Projetos & Unidades</h2>
          <p className="text-muted mb-0 small">
            Acompanhamento gerencial do portfólio de projetos cadastrados, secretarias atendidas, volume de OSs, alocação de equipes e custos.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={handleLimparFiltros}
            disabled={!isFiltroAtivo}
            title="Redefinir filtros"
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

      {/* Painel de Filtros */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <i className="bi bi-funnel-fill fs-6"></i>
            </div>
            <span className="fw-bold text-dark">Filtros do Módulo: Projetos & Unidades</span>
            {isFiltroAtivo && (
              <span className="badge bg-warning text-dark border border-warning-subtle">
                Filtros Ativos
              </span>
            )}
          </div>
          <span className="text-muted small">
            Exibindo <strong>{totalProjetosFiltrados}</strong> projeto(s) em <strong>{totalSecretariasFiltradas}</strong> secretaria(s)
          </span>
        </div>

        <div className="card-body p-3 bg-light-subtle">
          <div className="row g-3">
            {/* Filtro 1: Secretaria */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <FiltroMultiplaSelecao
                titulo="Secretaria / Órgão"
                icone="bi-building"
                placeholder="Todas as Secretarias"
                opcoes={opcoesSecretarias}
                selecionados={filtroSecretarias}
                onSelectionChange={(selecionados) => {
                  setFiltroSecretarias(selecionados);
                  // Limpa projetos selecionados que não pertencem às novas secretarias (se houver filtro)
                  if (selecionados.length > 0) {
                    setFiltroProjetos((prev) =>
                      prev.filter((projId) => {
                        const proj = projetos.find((p) => String(p.id) === projId);
                        return proj && selecionados.includes(proj.sigla_secretaria.trim().toUpperCase());
                      })
                    );
                  }
                }}
              />
            </div>

            {/* Filtro 2: Projeto */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <FiltroMultiplaSelecao
                titulo="Projeto / Unidade"
                icone="bi-diagram-3"
                placeholder="Todos os Projetos"
                opcoes={opcoesProjetos}
                selecionados={filtroProjetos}
                onSelectionChange={setFiltroProjetos}
              />
            </div>

            {/* Filtro 3: Ano */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <FiltroMultiplaSelecao
                titulo="Ano de Referência"
                icone="bi-calendar-event"
                placeholder="Todos os Anos"
                opcoes={opcoesAnos}
                selecionados={filtroAnos}
                onSelectionChange={setFiltroAnos}
              />
            </div>

            {/* Filtro 4: Situação SGC */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <FiltroMultiplaSelecao
                titulo="Situação SGC"
                icone="bi-check2-circle"
                placeholder="Todas as Situações"
                opcoes={opcoesSituacoesSgc}
                selecionados={filtroSituacoesSgc}
                onSelectionChange={setFiltroSituacoesSgc}
              />
            </div>

            {/* Filtro 5: Situação Passivo */}
            <div className="col-12 col-sm-6 col-md-4 col-xl">
              <FiltroMultiplaSelecao
                titulo="Situação Passivo 2026"
                icone="bi-hourglass-split"
                placeholder="Todos os Passivos"
                opcoes={opcoesSituacoesPassivo}
                selecionados={filtroSituacoesPassivo}
                onSelectionChange={setFiltroSituacoesPassivo}
              />
            </div>
          </div>

          {isFiltroAtivo && (
            <div className="d-flex justify-content-end mt-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                onClick={handleLimparFiltros}
              >
                <i className="bi bi-x-circle"></i>
                <span>Limpar Filtros Selecionados</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Indicadores de Destaque (Cards Obrigatórios) */}
      <div className="row g-3 mb-4">
        {/* Indicador 1: Quantidade de Projetos */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Quantidade de Projetos
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {totalProjetosFiltrados}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      / {projetos.length} cadastrados
                    </span>
                  </h3>
                  <small className="text-primary fw-medium">
                    Projetos corporativos no escopo
                  </small>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-3">
                  <i className="bi bi-kanban-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 2: Quantidade de Secretarias */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Quantidade de Secretarias
                  </span>
                  <h3 className="fw-bold text-success mb-0 mt-1">
                    {totalSecretariasFiltradas}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      secretarias
                    </span>
                  </h3>
                  <small className="text-muted">
                    Órgãos governamentais atendidos
                  </small>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-3">
                  <i className="bi bi-building-check fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 3: Custo Médio das OSs Mensais dos Projetos */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Custo Médio das OSs Mensais dos Projetos
                  </span>
                  <h3 className="fw-bold text-info mb-0 mt-1 font-monospace">
                    {formatCurrency(custoMedioOssMensais)}
                  </h3>
                  <small className="text-muted">
                    Média de valor por Ordem de Serviço
                  </small>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-calculator-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos Analíticos */}
      <div className="row g-3 mb-4">
        {/* Gráfico 1: Custos Totais por Projeto / Secretaria */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-bar-chart-line-fill text-primary"></i>
                  Custos Totais por {agrupamentoCusto === 'projeto' ? 'Projeto' : 'Secretaria'}
                </span>
                <small className="text-muted">
                  Volume orçamentário alocado por demandante
                </small>
              </div>

              {/* Toggle de agrupamento */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${agrupamentoCusto === 'projeto' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setAgrupamentoCusto('projeto')}
                >
                  Por Projeto
                </button>
                <button
                  type="button"
                  className={`btn ${agrupamentoCusto === 'secretaria' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setAgrupamentoCusto('secretaria')}
                >
                  Por Secretaria
                </button>
              </div>
            </div>

            <div className="card-body p-3">
              {dadosGraficoCusto.labels.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Nenhum dado para o recorte selecionado.
                </div>
              ) : (
                <div style={{ height: '320px', position: 'relative' }}>
                  <canvas ref={custoBarChartRef}></canvas>
                </div>
              )}
            </div>

            <div className="card-footer bg-light py-2 px-3 text-muted small d-flex justify-content-between">
              <span>Classificação: <strong>{dadosGraficoCusto.labels.length}</strong> itens</span>
              <span className="text-primary fw-bold font-monospace">
                Total: {formatCurrency(custoTotalFiltrado)}
              </span>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Quantidade de OSs por Secretaria / Projeto */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-pie-chart-fill text-success"></i>
                  Distribuição de OSs
                </span>
                <small className="text-muted">
                  Volume de Ordens de Serviço cadastradas
                </small>
              </div>

              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${agrupamentoOs === 'secretaria' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setAgrupamentoOs('secretaria')}
                >
                  Por Secretaria
                </button>
                <button
                  type="button"
                  className={`btn ${agrupamentoOs === 'projeto' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setAgrupamentoOs('projeto')}
                >
                  Por Projeto
                </button>
              </div>
            </div>

            <div className="card-body p-3">
              {dadosGraficoOs.labels.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Nenhum dado de OS encontrado.
                </div>
              ) : (
                <div style={{ height: '320px', position: 'relative' }}>
                  <canvas ref={osDoughnutChartRef}></canvas>
                </div>
              )}
            </div>

            <div className="card-footer bg-light py-2 px-3 text-muted small d-flex justify-content-between">
              <span>Agrupado por: <strong className="text-uppercase">{agrupamentoOs}</strong></span>
              <span className="text-dark fw-bold">Total: {totalOssFiltradas} OS(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Alocação das Equipes por Projeto */}
      <div className="card border-0 shadow-sm bg-white mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-bold text-dark d-flex align-items-center gap-2">
              <i className="bi bi-people-fill text-info"></i>
              Alocação das Equipes por Projeto
            </span>
            <small className="text-muted">
              Relação entre designações totais e quantidade de profissionais distintos dedicados a cada projeto
            </small>
          </div>
          <span className="badge bg-info-subtle text-info border border-info-subtle">
            Equipe / Demanda
          </span>
        </div>

        <div className="card-body p-3">
          {dadosGraficoEquipe.labels.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
              Nenhuma equipe alocada nos projetos filtrados.
            </div>
          ) : (
            <div style={{ height: '280px', position: 'relative' }}>
              <canvas ref={equipeBarChartRef}></canvas>
            </div>
          )}
        </div>
      </div>

      {/* Tabela Analítica Consolidada de Projetos & Secretarias */}
      <div className="card border-0 shadow-sm bg-white">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
              <i className="bi bi-table text-primary"></i>
              Consolidação Analítica de Projetos & Secretarias
            </span>
            <small className="text-muted">
              Visão detalhada por projeto com contagem de OSs, equipes alocadas e valores consolidados
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
                placeholder="Buscar projeto ou secretaria..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
              {termoBusca && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setTermoBusca('')}
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
                <th style={{ width: '130px' }}>Secretaria</th>
                <th style={{ width: '150px' }}>Sigla Projeto</th>
                <th>Nome do Projeto</th>
                <th className="text-center" style={{ width: '100px' }}>Qtd. OSs</th>
                <th className="text-center" style={{ width: '140px' }}>Designações</th>
                <th className="text-center" style={{ width: '130px' }}>Profissionais</th>
                <th className="text-end" style={{ width: '160px' }}>Custo Total (R$)</th>
                <th className="text-end" style={{ width: '160px' }}>Custo Médio / OS</th>
                <th style={{ width: '140px' }}>OSs Vinculadas</th>
              </tr>
            </thead>
            <tbody className="small">
              {tabelaFinal.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <i className="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    Nenhum projeto encontrado com os filtros e busca aplicados.
                  </td>
                </tr>
              ) : (
                tabelaFinal.map((item) => (
                  <tr key={item.id}>
                    {/* Secretaria */}
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace">
                        {item.sigla_secretaria}
                      </span>
                    </td>

                    {/* Sigla Projeto */}
                    <td>
                      <span className="fw-bold text-dark">{item.sigla_projeto}</span>
                    </td>

                    {/* Nome do Projeto */}
                    <td>
                      <div className="fw-medium text-dark">{item.nome_projeto}</div>
                      <small className="text-muted">{item.nome_secretaria}</small>
                    </td>

                    {/* Qtd. OSs */}
                    <td className="text-center">
                      <span className="badge bg-primary text-white rounded-pill px-2">
                        {item.qtd_oss}
                      </span>
                    </td>

                    {/* Designações */}
                    <td className="text-center">
                      <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2">
                        {item.total_alocacoes}
                      </span>
                    </td>

                    {/* Profissionais Únicos */}
                    <td className="text-center">
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2">
                        {item.profissionais_unicos} únicos
                      </span>
                    </td>

                    {/* Custo Total */}
                    <td className="text-end font-monospace fw-bold text-dark">
                      {formatCurrency(item.custo_total)}
                    </td>

                    {/* Custo Médio / OS */}
                    <td className="text-end font-monospace text-muted">
                      {formatCurrency(item.custo_medio_por_os)}
                    </td>

                    {/* OSs vinculadas */}
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {item.oss.length === 0 ? (
                          <span className="text-muted small">—</span>
                        ) : (
                          item.oss.map((os) => (
                            <span key={os.id} className="badge bg-light text-dark border small" title={`Ano ${os.ano_referencia} - ${os.situacao_sgc || 'Sem status'}`}>
                              OS #{os.numero_os}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {tabelaFinal.length > 0 && (
              <tfoot className="table-light fw-bold small">
                <tr>
                  <td colSpan={3} className="text-end">Totais Consolidados:</td>
                  <td className="text-center text-primary">{totalOssFiltradas}</td>
                  <td className="text-center text-info">{totalAlocacoesEquipe}</td>
                  <td className="text-center text-success">
                    {new Set(tabelaFinal.flatMap((i) => i.alocacoes.map((a) => a.nome_profissional?.trim().toLowerCase())).filter(Boolean)).size}
                  </td>
                  <td className="text-end text-success font-monospace">
                    {formatCurrency(custoTotalFiltrado)}
                  </td>
                  <td className="text-end font-monospace text-muted">
                    {formatCurrency(custoMedioOssMensais)}
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
