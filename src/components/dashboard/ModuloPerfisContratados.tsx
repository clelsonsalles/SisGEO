import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSisgos } from '../../context/SisgosContext';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { MESES_REFERENCIA, MesReferencia } from '../../types/models';

Chart.register(...registerables);

interface ModuloPerfisContratadosProps {
  onVoltarHub: () => void;
}

export const ModuloPerfisContratados: React.FC<ModuloPerfisContratadosProps> = ({ onVoltarHub }) => {
  const { ordensServico, projetos, perfis, alocacoes } = useSisgos();

  // Canvas refs for Chart.js
  const perfilDemandChartRef = useRef<HTMLCanvasElement | null>(null);
  const perfilCostChartRef = useRef<HTMLCanvasElement | null>(null);
  const evolucaoMensalChartRef = useRef<HTMLCanvasElement | null>(null);

  // Instances of Chart.js
  const perfilDemandInstance = useRef<Chart | null>(null);
  const perfilCostInstance = useRef<Chart | null>(null);
  const evolucaoMensalInstance = useRef<Chart | null>(null);

  // Filtros
  const [filtroProfissional, setFiltroProfissional] = useState<string>('TODOS');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('TODOS');
  const [filtroMes, setFiltroMes] = useState<string>('TODOS');
  const [filtroProjeto, setFiltroProjeto] = useState<string>('TODOS');
  const [filtroSecretaria, setFiltroSecretaria] = useState<string>('TODOS');

  // Busca na tabela
  const [termoBuscaTabela, setTermoBuscaTabela] = useState<string>('');

  // 1. Listas dinâmicas para selects de filtros
  const listaProfissionais = useMemo(() => {
    const nomes = Array.from(
      new Set(alocacoes.map((a) => a.nome_profissional?.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return nomes;
  }, [alocacoes]);

  const listaSecretarias = useMemo(() => {
    const secMap = new Map<string, string>();
    projetos.forEach((p) => {
      secMap.set(p.sigla_secretaria.trim().toUpperCase(), p.nome_secretaria.trim());
    });
    return Array.from(secMap.entries()).map(([sigla, nome]) => ({ sigla, nome }));
  }, [projetos]);

  // Limpar filtros
  const handleLimparFiltros = () => {
    setFiltroProfissional('TODOS');
    setFiltroPerfil('TODOS');
    setFiltroMes('TODOS');
    setFiltroProjeto('TODOS');
    setFiltroSecretaria('TODOS');
    setTermoBuscaTabela('');
  };

  const isFiltroAtivo =
    filtroProfissional !== 'TODOS' ||
    filtroPerfil !== 'TODOS' ||
    filtroMes !== 'TODOS' ||
    filtroProjeto !== 'TODOS' ||
    filtroSecretaria !== 'TODOS';

  // 2. Base enriquecida cruzando Alocação + Perfil + OS + Projeto
  interface ItemCruzado {
    id: number;
    ordem_servico_id: number;
    numero_os: number;
    ano_referencia: number;
    mes_referencia: MesReferencia;
    projeto_id: number;
    sigla_projeto: string;
    nome_projeto: string;
    sigla_secretaria: string;
    nome_secretaria: string;
    perfil_contratado_id: number;
    nome_perfil: string;
    item_contratacao: string;
    custo_mensal_perfil: number;
    nome_profissional: string;
    percentual_alocacao: number;
    custo_alocacao: number;
    documento_referencia: string;
  }

  const dadosCruzados = useMemo<ItemCruzado[]>(() => {
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
        sigla_projeto: proj ? proj.sigla_projeto : 'N/D',
        nome_projeto: proj ? proj.nome_projeto : 'Projeto não encontrado',
        sigla_secretaria: proj ? proj.sigla_secretaria : 'N/D',
        nome_secretaria: proj ? proj.nome_secretaria : 'Secretaria não encontrada',
        perfil_contratado_id: aloc.perfil_contratado_id,
        nome_perfil: perf ? perf.nome_perfil : `Perfil #${aloc.perfil_contratado_id}`,
        item_contratacao: perf ? perf.item_contratacao : '',
        custo_mensal_perfil: aloc.custo_mensal_perfil,
        nome_profissional: aloc.nome_profissional || 'Não informado',
        percentual_alocacao: aloc.percentual_alocacao,
        custo_alocacao: aloc.custo_alocacao,
        documento_referencia: aloc.documento_referencia,
      };
    });
  }, [alocacoes, ordensServico, projetos, perfis]);

  // 3. Aplicação dos Filtros
  const dadosFiltrados = useMemo(() => {
    return dadosCruzados.filter((item) => {
      if (
        filtroProfissional !== 'TODOS' &&
        item.nome_profissional.trim().toLowerCase() !== filtroProfissional.trim().toLowerCase()
      ) {
        return false;
      }
      if (filtroPerfil !== 'TODOS' && String(item.perfil_contratado_id) !== filtroPerfil) {
        return false;
      }
      if (filtroMes !== 'TODOS' && item.mes_referencia !== filtroMes) {
        return false;
      }
      if (filtroProjeto !== 'TODOS' && String(item.projeto_id) !== filtroProjeto) {
        return false;
      }
      if (
        filtroSecretaria !== 'TODOS' &&
        item.sigla_secretaria.trim().toUpperCase() !== filtroSecretaria
      ) {
        return false;
      }
      return true;
    });
  }, [dadosCruzados, filtroProfissional, filtroPerfil, filtroMes, filtroProjeto, filtroSecretaria]);

  // 4. Indicadores de Destaque Obrigatórios
  // Indicador 1: Quantidade de Profissionais
  const totalProfissionaisFiltrados = useMemo(() => {
    return new Set(dadosFiltrados.map((d) => d.nome_profissional.trim().toLowerCase())).size;
  }, [dadosFiltrados]);

  // Indicador 2: Quantidade de Perfis
  const totalPerfisCatalogo = perfis.length;
  const totalPerfisEmUso = useMemo(() => {
    return new Set(dadosFiltrados.map((d) => d.perfil_contratado_id)).size;
  }, [dadosFiltrados]);

  // Indicador 3: Custo Mensal total dos Perfis
  const custoMensalTotalPerfis = useMemo(() => {
    return perfis.reduce((acc, p) => acc + (p.custo_mensal_perfil || 0), 0);
  }, [perfis]);

  const custoTotalAlocadoRecorte = useMemo(() => {
    return dadosFiltrados.reduce((acc, curr) => acc + curr.custo_alocacao, 0);
  }, [dadosFiltrados]);

  // 5. Matriz de Alocação Mensal do Profissional
  // Estrutura por Mês: { [mes]: { totalPercentual: number, custoTotal: number, projetos: Array<{ projeto: string, percentual: number, os: number }> } }
  const mapaMensalProfissional = useMemo(() => {
    const meses = MESES_REFERENCIA;
    const mapa: {
      [mes in MesReferencia]: {
        mes: MesReferencia;
        totalPercentual: number;
        custoTotal: number;
        itens: ItemCruzado[];
      };
    } = {} as any;

    meses.forEach((mes) => {
      const itensDoMes = dadosFiltrados.filter((d) => d.mes_referencia === mes);
      const totalPercentual = itensDoMes.reduce((acc, cur) => acc + cur.percentual_alocacao, 0);
      const custoTotal = itensDoMes.reduce((acc, cur) => acc + cur.custo_alocacao, 0);

      mapa[mes] = {
        mes,
        totalPercentual,
        custoTotal,
        itens: itensDoMes,
      };
    });

    return mapa;
  }, [dadosFiltrados]);

  // Matriz consolidada de Todos os Profissionais (quando nenhum profissional específico é selecionado ou para tabela resumo)
  const matrizTodosProfissionais = useMemo(() => {
    const profMap = new Map<
      string,
      {
        nome: string;
        perfis: Set<string>;
        meses: { [mes in MesReferencia]: number };
        totalAlocacoes: number;
        custoTotal: number;
      }
    >();

    dadosCruzados.forEach((item) => {
      const nome = item.nome_profissional.trim();
      if (!profMap.has(nome)) {
        const initMeses: any = {};
        MESES_REFERENCIA.forEach((m) => {
          initMeses[m] = 0;
        });
        profMap.set(nome, {
          nome,
          perfis: new Set(),
          meses: initMeses,
          totalAlocacoes: 0,
          custoTotal: 0,
        });
      }
      const record = profMap.get(nome)!;
      record.perfis.add(item.nome_perfil);
      record.meses[item.mes_referencia] =
        (record.meses[item.mes_referencia] || 0) + item.percentual_alocacao;
      record.totalAlocacoes += 1;
      record.custoTotal += item.custo_alocacao;
    });

    return Array.from(profMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [dadosCruzados]);

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

  // 6. Gráfico 1: Quantidade de Alocações por Perfil
  const dadosGraficoPerfilDemand = useMemo(() => {
    const mapCount: { [perfil: string]: number } = {};
    dadosFiltrados.forEach((d) => {
      mapCount[d.nome_perfil] = (mapCount[d.nome_perfil] || 0) + 1;
    });
    const labels = Object.keys(mapCount);
    const data = labels.map((l) => mapCount[l]);
    return { labels, data };
  }, [dadosFiltrados]);

  useEffect(() => {
    if (!perfilDemandChartRef.current) return;
    if (perfilDemandInstance.current) perfilDemandInstance.current.destroy();

    const ctx = perfilDemandChartRef.current.getContext('2d');
    if (!ctx) return;

    perfilDemandInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dadosGraficoPerfilDemand.labels,
        datasets: [
          {
            label: 'Alocações / Atuações',
            data: dadosGraficoPerfilDemand.data,
            backgroundColor: dadosGraficoPerfilDemand.labels.map(
              (_, i) => chartPalette[i % chartPalette.length] + 'cc'
            ),
            borderColor: dadosGraficoPerfilDemand.labels.map(
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
              label: (context) => ` ${context.raw} alocação(ões) ativa(s)`,
            },
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
      if (perfilDemandInstance.current) perfilDemandInstance.current.destroy();
    };
  }, [dadosGraficoPerfilDemand]);

  // 7. Gráfico 2: Custo Consolidado por Perfil Contratado (R$)
  const dadosGraficoPerfilCost = useMemo(() => {
    const mapCost: { [perfil: string]: number } = {};
    dadosFiltrados.forEach((d) => {
      mapCost[d.nome_perfil] = (mapCost[d.nome_perfil] || 0) + d.custo_alocacao;
    });
    const labels = Object.keys(mapCost);
    const data = labels.map((l) => mapCost[l]);
    return { labels, data };
  }, [dadosFiltrados]);

  useEffect(() => {
    if (!perfilCostChartRef.current) return;
    if (perfilCostInstance.current) perfilCostInstance.current.destroy();

    const ctx = perfilCostChartRef.current.getContext('2d');
    if (!ctx) return;

    perfilCostInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dadosGraficoPerfilCost.labels,
        datasets: [
          {
            data: dadosGraficoPerfilCost.data,
            backgroundColor: dadosGraficoPerfilCost.labels.map(
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
              label: (context) => ` Custo: ${formatCurrency(context.raw as number)}`,
            },
          },
        },
        cutout: '60%',
      },
    });

    return () => {
      if (perfilCostInstance.current) perfilCostInstance.current.destroy();
    };
  }, [dadosGraficoPerfilCost]);

  // 8. Gráfico 3: Alocação Mensal ao longo dos Meses
  const dadosGraficoEvolucaoMensal = useMemo(() => {
    const labels = MESES_REFERENCIA;
    const dataPercent = labels.map((mes) => mapaMensalProfissional[mes]?.totalPercentual || 0);
    const dataCost = labels.map((mes) => mapaMensalProfissional[mes]?.custoTotal || 0);
    return { labels, dataPercent, dataCost };
  }, [mapaMensalProfissional]);

  useEffect(() => {
    if (!evolucaoMensalChartRef.current) return;
    if (evolucaoMensalInstance.current) evolucaoMensalInstance.current.destroy();

    const ctx = evolucaoMensalChartRef.current.getContext('2d');
    if (!ctx) return;

    evolucaoMensalInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dadosGraficoEvolucaoMensal.labels,
        datasets: [
          {
            type: 'bar',
            label: filtroProfissional !== 'TODOS' ? `% Alocação de ${filtroProfissional}` : '% Alocação Consolidada',
            data: dadosGraficoEvolucaoMensal.dataPercent,
            backgroundColor: '#0d6efdcc',
            borderColor: '#0d6efd',
            borderWidth: 1.5,
            borderRadius: 4,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Custo Total Alocado (R$)',
            data: dadosGraficoEvolucaoMensal.dataCost,
            borderColor: '#198754',
            backgroundColor: '#198754',
            borderWidth: 2,
            pointRadius: 4,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 0) {
                  return ` Alocação: ${context.raw}%`;
                }
                return ` Custo: ${formatCurrency(context.raw as number)}`;
              },
            },
          },
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: '% Alocação', font: { size: 10 } },
            ticks: {
              callback: (val) => `${val}%`,
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Custo (R$)', font: { size: 10 } },
            ticks: {
              callback: (val) => formatCurrency(val as number),
            },
          },
        },
      },
    });

    return () => {
      if (evolucaoMensalInstance.current) evolucaoMensalInstance.current.destroy();
    };
  }, [dadosGraficoEvolucaoMensal, filtroProfissional]);

  // 9. Tabela final filtrada por busca textual
  const tabelaFinal = useMemo(() => {
    if (!termoBuscaTabela.trim()) return dadosFiltrados;
    const query = termoBuscaTabela.toLowerCase().trim();
    return dadosFiltrados.filter((item) => {
      return (
        item.nome_profissional.toLowerCase().includes(query) ||
        item.nome_perfil.toLowerCase().includes(query) ||
        item.sigla_projeto.toLowerCase().includes(query) ||
        item.nome_projeto.toLowerCase().includes(query) ||
        item.sigla_secretaria.toLowerCase().includes(query) ||
        String(item.numero_os).includes(query) ||
        item.documento_referencia.toLowerCase().includes(query)
      );
    });
  }, [dadosFiltrados, termoBuscaTabela]);

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'Profissional',
      'Perfil Contratado',
      'Custo Mensal Base (R$)',
      'Mês Referência',
      'OS',
      'Projeto Sigla',
      'Projeto Nome',
      'Secretaria',
      'Percentual Alocação (%)',
      'Custo Alocação (R$)',
      'Documento Referência',
    ];

    const rows = tabelaFinal.map((item) => [
      `"${item.nome_profissional}"`,
      `"${item.nome_perfil}"`,
      item.custo_mensal_perfil.toFixed(2),
      item.mes_referencia,
      item.numero_os,
      `"${item.sigla_projeto}"`,
      `"${item.nome_projeto.replace(/"/g, '""')}"`,
      `"${item.sigla_secretaria}"`,
      item.percentual_alocacao,
      item.custo_alocacao.toFixed(2),
      `"${item.documento_referencia}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sisgos_perfis_profissionais_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <span className="badge bg-info-subtle text-info border border-info-subtle fw-bold">
              Módulo 3
            </span>
            <span className="text-muted small">RH & Alocação por Profissional</span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Dashboard Analítico de Perfis Contratados</h2>
          <p className="text-muted mb-0 small">
            Cruzamento analítico de perfis, distribuição em OSs, projetos e secretarias, com rastreamento da taxa mensal de alocação de cada profissional.
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
            <div className="bg-info text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
              <i className="bi bi-person-fill-gear fs-6"></i>
            </div>
            <span className="fw-bold text-dark">Filtros do Módulo: Perfis & Profissionais</span>
            {isFiltroAtivo && (
              <span className="badge bg-warning text-dark border border-warning-subtle">
                Filtros Ativos
              </span>
            )}
          </div>
          <span className="text-muted small">
            Exibindo <strong>{dadosFiltrados.length}</strong> designações de <strong>{totalProfissionaisFiltrados}</strong> profissional(is)
          </span>
        </div>

        <div className="card-body p-3 bg-light-subtle">
          <div className="row g-3">
            {/* Filtro Chave: Nome do Profissional */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-3">
              <label className="form-label small fw-bold text-primary mb-1 d-flex align-items-center gap-1">
                <i className="bi bi-person-check-fill"></i>
                Nome do Profissional (Filtro Chave)
              </label>
              <select
                className="form-select form-select-sm border-primary shadow-none fw-semibold"
                value={filtroProfissional}
                onChange={(e) => setFiltroProfissional(e.target.value)}
              >
                <option value="TODOS">Todos os Profissionais</option>
                {listaProfissionais.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro 2: Perfil Contratado */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-3">
              <label className="form-label small fw-bold text-secondary mb-1">
                Perfil Contratado
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

            {/* Filtro 3: Mês de Referência */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
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

            {/* Filtro 4: Projeto */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                Projeto / Unidade
              </label>
              <select
                className="form-select form-select-sm shadow-none"
                value={filtroProjeto}
                onChange={(e) => setFiltroProjeto(e.target.value)}
              >
                <option value="TODOS">Todos os Projetos</option>
                {projetos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.sigla_projeto}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro 5: Secretaria */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                Secretaria
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

      {/* Indicadores de Destaque Obrigatórios */}
      <div className="row g-3 mb-4">
        {/* Indicador 1: Quantidade de Profissionais */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Quantidade de Profissionais
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {totalProfissionaisFiltrados}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      / {listaProfissionais.length} cadastrados
                    </span>
                  </h3>
                  <small className="text-primary fw-medium">
                    Profissionais com designações ativas
                  </small>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-3">
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 2: Quantidade de Perfis */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Quantidade de Perfis
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {totalPerfisCatalogo}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      ({totalPerfisEmUso} em uso no filtro)
                    </span>
                  </h3>
                  <small className="text-info fw-medium">
                    Especialidades do catálogo de TI
                  </small>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-award-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 3: Custo Mensal total dos Perfis */}
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100 bg-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Custo Mensal total dos Perfis
                  </span>
                  <h3 className="fw-bold text-success mb-0 mt-1 font-monospace">
                    {formatCurrency(custoMensalTotalPerfis)}
                  </h3>
                  <small className="text-muted">
                    Soma das tabelas bases de catálogo
                  </small>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-3">
                  <i className="bi bi-wallet2 fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: VISUALIZAÇÃO DA ALOCAÇÃO MENSAL E PERCENTUAL TOTAL DO PROFISSIONAL */}
      <div className="card border-0 shadow-sm bg-white mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
              <i className="bi bi-calendar3-range-fill text-primary"></i>
              {filtroProfissional !== 'TODOS' ? (
                <>
                  Rastreamento Mensal do Profissional:{' '}
                  <span className="text-primary">{filtroProfissional}</span>
                </>
              ) : (
                'Matriz Anual de Alocação Mensal por Profissional e Projetos'
              )}
            </span>
            <small className="text-muted">
              Visualização de como ficou a alocação nos projetos em cada mês e o percentual de alocação total
            </small>
          </div>

          {filtroProfissional !== 'TODOS' && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setFiltroProfissional('TODOS')}
            >
              <i className="bi bi-x-circle me-1"></i>
              Ver Todos os Profissionais
            </button>
          )}
        </div>

        <div className="card-body p-3">
          {filtroProfissional !== 'TODOS' ? (
            /* VISÃO ESPECÍFICA DO PROFISSIONAL SELECIONADO */
            <div>
              <div className="alert alert-primary-subtle border-primary-subtle d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 mb-3 rounded-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                    <i className="bi bi-person-badge fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">{filtroProfissional}</h5>
                    <small className="text-muted">
                      Perfis exercidos:{' '}
                      <strong>
                        {Array.from(new Set(dadosFiltrados.map((d) => d.nome_perfil))).join(', ')}
                      </strong>
                    </small>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <div className="text-end">
                    <small className="text-muted d-block">Projetos Atendidos</small>
                    <span className="fw-bold text-dark fs-6">
                      {new Set(dadosFiltrados.map((d) => d.sigla_projeto)).size} projeto(s)
                    </span>
                  </div>
                  <div className="vr"></div>
                  <div className="text-end">
                    <small className="text-muted d-block">Custo Total Gerado</small>
                    <span className="fw-bold text-success fs-6 font-monospace">
                      {formatCurrency(custoTotalAlocadoRecorte)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cards Mês a Mês do Profissional */}
              <div className="row g-3">
                {MESES_REFERENCIA.map((mes) => {
                  const info = mapaMensalProfissional[mes];
                  const totalPct = info ? info.totalPercentual : 0;
                  const custoMes = info ? info.custoTotal : 0;
                  const alocs = info ? info.itens : [];

                  return (
                    <div key={mes} className="col-12 col-md-6 col-xl-3">
                      <div
                        className={`card h-100 border ${
                          totalPct > 100
                            ? 'border-danger'
                            : totalPct === 100
                            ? 'border-success'
                            : totalPct > 0
                            ? 'border-primary'
                            : 'border-light-subtle bg-light-subtle opacity-75'
                        } shadow-none rounded-3`}
                      >
                        <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark">{mes}</span>
                          <span
                            className={`badge ${
                              totalPct > 100
                                ? 'bg-danger text-white'
                                : totalPct === 100
                                ? 'bg-success text-white'
                                : totalPct > 0
                                ? 'bg-primary text-white'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {formatPercent(totalPct)} Total
                          </span>
                        </div>

                        <div className="card-body p-3">
                          {alocs.length === 0 ? (
                            <div className="text-muted small py-3 text-center">
                              <i className="bi bi-dash-circle d-block mb-1"></i>
                              Sem alocações neste mês
                            </div>
                          ) : (
                            <div className="vstack gap-2">
                              {alocs.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-2 rounded bg-light border border-light-subtle small"
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="fw-bold text-dark">
                                      {item.sigla_projeto}
                                    </span>
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                      OS #{item.numero_os}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between text-muted text-xs">
                                    <span>Dedicação:</span>
                                    <strong className="text-dark">
                                      {formatPercent(item.percentual_alocacao)}
                                    </strong>
                                  </div>
                                  <div className="d-flex justify-content-between text-muted text-xs">
                                    <span>Custo Mensal:</span>
                                    <span className="font-monospace text-success fw-semibold">
                                      {formatCurrency(item.custo_alocacao)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="card-footer bg-light py-2 px-3 d-flex justify-content-between align-items-center small text-muted">
                          <span>Total Mês:</span>
                          <strong className="text-dark font-monospace">
                            {formatCurrency(custoMes)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MATRIZ GERAL COM TODOS OS PROFISSIONAIS (JANEIRO A DEZEMBRO) */
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle mb-0 text-center small">
                <thead className="table-light text-secondary text-uppercase text-xs">
                  <tr>
                    <th className="text-start" style={{ minWidth: 220 }}>
                      Profissional
                    </th>
                    <th className="text-start" style={{ minWidth: 180 }}>
                      Perfil(is)
                    </th>
                    {MESES_REFERENCIA.map((mes) => (
                      <th key={mes} style={{ minWidth: 70 }}>
                        {mes.slice(0, 3)}
                      </th>
                    ))}
                    <th style={{ minWidth: 120 }}>Custo Total</th>
                    <th style={{ minWidth: 90 }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {matrizTodosProfissionais.map((prof) => {
                    return (
                      <tr key={prof.nome}>
                        <td className="text-start fw-bold text-dark">
                          <i className="bi bi-person-circle text-primary me-2"></i>
                          {prof.nome}
                        </td>
                        <td className="text-start">
                          <div className="d-flex flex-wrap gap-1">
                            {Array.from(prof.perfis).map((p) => (
                              <span key={p} className="badge bg-light text-secondary border">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        {MESES_REFERENCIA.map((mes) => {
                          const pct = prof.meses[mes] || 0;
                          return (
                            <td key={mes}>
                              {pct > 0 ? (
                                <span
                                  className={`badge ${
                                    pct === 100
                                      ? 'bg-success text-white'
                                      : pct > 100
                                      ? 'bg-danger text-white'
                                      : 'bg-primary-subtle text-primary border border-primary-subtle'
                                  }`}
                                  title={`${prof.nome} em ${mes}: ${pct}%`}
                                >
                                  {pct}%
                                </span>
                              ) : (
                                <span className="text-muted opacity-25">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="font-monospace fw-bold text-success text-end">
                          {formatCurrency(prof.custoTotal)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm py-0 px-2 text-xs"
                            onClick={() => setFiltroProfissional(prof.nome)}
                            title={`Filtrar detalhes de ${prof.nome}`}
                          >
                            Filtrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos Analíticos de Perfis */}
      <div className="row g-3 mb-4">
        {/* Gráfico 1: Demanda e Alocações por Perfil */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-bar-chart-fill text-info"></i>
                  Volume de Alocações por Perfil Contratado
                </span>
                <small className="text-muted">
                  Contagem de designações em cada especialidade profissional
                </small>
              </div>
              <span className="badge bg-info-subtle text-info border border-info-subtle">
                Distribuição
              </span>
            </div>

            <div className="card-body p-3">
              {dadosGraficoPerfilDemand.labels.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Nenhum dado encontrado para o filtro.
                </div>
              ) : (
                <div style={{ height: '300px', position: 'relative' }}>
                  <canvas ref={perfilDemandChartRef}></canvas>
                </div>
              )}
            </div>

            <div className="card-footer bg-light py-2 px-3 text-muted small d-flex justify-content-between">
              <span>Perfis ativos no escopo: <strong>{dadosGraficoPerfilDemand.labels.length}</strong></span>
              <span>Total de designações: <strong>{dadosFiltrados.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Custo Consolidado por Perfil Contratado */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-pie-chart-fill text-success"></i>
                  Custo Consolidado por Perfil Contratado (R$)
                </span>
                <small className="text-muted">
                  Participação financeira de cada perfil na execução
                </small>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                Financeiro
              </span>
            </div>

            <div className="card-body p-3">
              {dadosGraficoPerfilCost.labels.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Nenhum custo encontrado para o filtro.
                </div>
              ) : (
                <div style={{ height: '300px', position: 'relative' }}>
                  <canvas ref={perfilCostChartRef}></canvas>
                </div>
              )}
            </div>

            <div className="card-footer bg-light py-2 px-3 text-muted small d-flex justify-content-between">
              <span>Total Financeiro:</span>
              <strong className="text-success font-monospace">
                {formatCurrency(custoTotalAlocadoRecorte)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico 3: Evolução Mensal da Alocação e Custos */}
      <div className="card border-0 shadow-sm bg-white mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-bold text-dark d-flex align-items-center gap-2">
              <i className="bi bi-graph-up text-primary"></i>
              Evolução Temporal: % de Alocação e Custo Mensal (2026)
            </span>
            <small className="text-muted">
              Acompanhamento mês a mês da taxa de alocação acumulada e o desembolso correspondente
            </small>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
            Linhas & Barras
          </span>
        </div>

        <div className="card-body p-3">
          <div style={{ height: '280px', position: 'relative' }}>
            <canvas ref={evolucaoMensalChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada com Cruzamento de Dados */}
      <div className="card border-0 shadow-sm bg-white">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-2">
              <i className="bi bi-table text-primary"></i>
              Detalhamento Transacional: Perfis, Profissionais e Alocações
            </span>
            <small className="text-muted">
              Cruzamento de dados do perfil com as OSs, projetos e secretarias atendidas
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
                placeholder="Buscar profissional, perfil, projeto..."
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
                <th>Profissional</th>
                <th>Perfil Contratado</th>
                <th className="text-end" style={{ width: '130px' }}>Custo Base</th>
                <th style={{ width: '110px' }}>Mês</th>
                <th style={{ width: '90px' }}>OS</th>
                <th style={{ width: '130px' }}>Projeto</th>
                <th style={{ width: '100px' }}>Secretaria</th>
                <th className="text-center" style={{ width: '110px' }}>Alocação (%)</th>
                <th className="text-end" style={{ width: '140px' }}>Custo Alocação (R$)</th>
                <th style={{ width: '130px' }}>Doc. Ref.</th>
              </tr>
            </thead>
            <tbody className="small">
              {tabelaFinal.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-5 text-muted">
                    <i className="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                tabelaFinal.map((item) => (
                  <tr key={item.id}>
                    {/* Profissional */}
                    <td>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-dark fw-bold text-decoration-none text-start"
                        onClick={() => setFiltroProfissional(item.nome_profissional)}
                        title="Filtrar por este profissional"
                      >
                        {item.nome_profissional}
                        <i className="bi bi-filter ms-1 text-primary small"></i>
                      </button>
                    </td>

                    {/* Perfil */}
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {item.nome_perfil}
                      </span>
                    </td>

                    {/* Custo Base */}
                    <td className="text-end font-monospace text-muted">
                      {formatCurrency(item.custo_mensal_perfil)}
                    </td>

                    {/* Mês */}
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {item.mes_referencia}
                      </span>
                    </td>

                    {/* OS */}
                    <td>
                      <span className="badge bg-light text-dark border font-monospace">
                        OS #{item.numero_os}
                      </span>
                    </td>

                    {/* Projeto */}
                    <td>
                      <span className="fw-semibold text-dark">{item.sigla_projeto}</span>
                    </td>

                    {/* Secretaria */}
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle font-monospace">
                        {item.sigla_secretaria}
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
            {tabelaFinal.length > 0 && (
              <tfoot className="table-light fw-bold small">
                <tr>
                  <td colSpan={7} className="text-end">Total Geral do Recorte:</td>
                  <td className="text-center text-primary">
                    {formatPercent(
                      tabelaFinal.reduce((a, c) => a + c.percentual_alocacao, 0) /
                        tabelaFinal.length
                    )}{' '}
                    (média)
                  </td>
                  <td className="text-end text-success font-monospace fs-6">
                    {formatCurrency(custoTotalAlocadoRecorte)}
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
