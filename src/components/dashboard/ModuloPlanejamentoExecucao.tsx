import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useSisgos } from '../../context/SisgosContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { MesReferencia, MESES_REFERENCIA } from '../../types/models';
import { FiltroMultiplaSelecao, OpcaoFiltro } from './FiltroMultiplaSelecao';

Chart.register(...registerables);

interface ModuloPlanejamentoExecucaoProps {
  onVoltarHub: () => void;
}

interface EmpenhoAgrupado {
  tipo: 'PLANEJAMENTO' | 'FATURAMENTO';
  rotulo_tipo: string;
  codigo_ne: string;
  valor_total: number;
  quantidade_os: number;
  numeros_os: number[];
  projetos_vinculados: string[];
  secretarias_vinculadas: string[];
  meses_referencia: MesReferencia[];
}

export const ModuloPlanejamentoExecucao: React.FC<ModuloPlanejamentoExecucaoProps> = ({
  onVoltarHub,
}) => {
  const { ordensServico, projetos, alocacoes, getCalculoValorTotalOS } = useSisgos();

  // Canvas refs para Chart.js
  const barChartProjetoRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartMesesRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutCoberturaRef = useRef<HTMLCanvasElement | null>(null);

  // Instâncias dos gráficos Chart.js
  const barChartProjetoInstance = useRef<Chart | null>(null);
  const lineChartMesesInstance = useRef<Chart | null>(null);
  const doughnutCoberturaInstance = useRef<Chart | null>(null);

  // Filtros com MÚLTIPLA SELEÇÃO
  const [filtroProjetos, setFiltroProjetos] = useState<string[]>([]);
  const [filtroSecretarias, setFiltroSecretarias] = useState<string[]>([]);
  const [filtroMeses, setFiltroMeses] = useState<string[]>([]);
  const [filtroAnos, setFiltroAnos] = useState<string[]>([]);
  const [filtroNesPlanejamento, setFiltroNesPlanejamento] = useState<string[]>([]);
  const [filtroNesFaturamento, setFiltroNesFaturamento] = useState<string[]>([]);
  const [filtroTipoVisualizacaoTabela, setFiltroTipoVisualizacaoTabela] = useState<
    'TODOS' | 'PLANEJAMENTO' | 'FATURAMENTO'
  >('TODOS');

  // Alternador de visão de cruzamento no gráfico principal: 'projeto' ou 'secretaria'
  const [visaoAgrupamentoGrafico, setVisaoAgrupamentoGrafico] = useState<'projeto' | 'secretaria'>('projeto');

  // Termos de busca nas tabelas
  const [termoBuscaEmpenhos, setTermoBuscaEmpenhos] = useState<string>('');
  const [termoBuscaOss, setTermoBuscaOss] = useState<string>('');

  // Aba ativa de visualização de tabelas
  const [abaAtiva, setAbaAtiva] = useState<'tabela-empenhos' | 'tabela-oss'>('tabela-empenhos');

  // Mapa rápido de projetos
  const mapaProjetos = useMemo(() => {
    const map = new Map<number, { sigla: string; nome: string; secretaria: string }>();
    projetos.forEach((p) => {
      map.set(p.id, {
        sigla: p.sigla_projeto || p.nome_projeto,
        nome: p.nome_projeto,
        secretaria: p.sigla_secretaria.trim().toUpperCase(),
      });
    });
    return map;
  }, [projetos]);

  // Mapa de OS -> Meses de Referência das Alocações
  const mapaMesesPorOs = useMemo(() => {
    const map = new Map<number, Set<MesReferencia>>();
    alocacoes.forEach((aloc) => {
      if (!map.has(aloc.ordem_servico_id)) {
        map.set(aloc.ordem_servico_id, new Set<MesReferencia>());
      }
      map.get(aloc.ordem_servico_id)!.add(aloc.mes_referencia);
    });
    return map;
  }, [alocacoes]);

  // 1. Listas dinâmicas para os filtros de Múltipla Seleção
  const opcoesProjetos: OpcaoFiltro[] = useMemo(() => {
    return projetos.map((p) => ({
      value: String(p.id),
      label: p.sigla_projeto || p.nome_projeto,
      sublabel: p.sigla_secretaria,
    }));
  }, [projetos]);

  const opcoesSecretarias: OpcaoFiltro[] = useMemo(() => {
    const secMap = new Map<string, string>();
    projetos.forEach((p) => {
      const sigla = p.sigla_secretaria.trim().toUpperCase();
      if (!secMap.has(sigla)) {
        secMap.set(sigla, p.nome_secretaria.trim());
      }
    });
    return Array.from(secMap.entries()).map(([sigla, nome]) => ({
      value: sigla,
      label: sigla,
      sublabel: nome,
    }));
  }, [projetos]);

  const opcoesMeses: OpcaoFiltro[] = useMemo(() => {
    return MESES_REFERENCIA.map((mes) => ({
      value: mes,
      label: mes,
    }));
  }, []);

  const opcoesAnos: OpcaoFiltro[] = useMemo(() => {
    const anos = Array.from(new Set(ordensServico.map((os) => os.ano_referencia))).sort((a, b) => b - a);
    return anos.map((ano) => ({
      value: String(ano),
      label: String(ano),
    }));
  }, [ordensServico]);

  const opcoesNesPlanejamento: OpcaoFiltro[] = useMemo(() => {
    const nes = Array.from(
      new Set(ordensServico.map((os) => (os.ne_planejamento || '').trim()).filter(Boolean))
    ).sort();
    return nes.map((ne) => ({
      value: ne,
      label: ne,
      badge: 'Planejamento',
    }));
  }, [ordensServico]);

  const opcoesNesFaturamento: OpcaoFiltro[] = useMemo(() => {
    const nes = Array.from(
      new Set(ordensServico.map((os) => (os.ne_faturamento || '').trim()).filter(Boolean))
    ).sort();
    return nes.map((ne) => ({
      value: ne,
      label: ne,
      badge: 'Faturamento',
    }));
  }, [ordensServico]);

  const isFiltroAtivo =
    filtroProjetos.length > 0 ||
    filtroSecretarias.length > 0 ||
    filtroMeses.length > 0 ||
    filtroAnos.length > 0 ||
    filtroNesPlanejamento.length > 0 ||
    filtroNesFaturamento.length > 0;

  const handleLimparFiltros = () => {
    setFiltroProjetos([]);
    setFiltroSecretarias([]);
    setFiltroMeses([]);
    setFiltroAnos([]);
    setFiltroNesPlanejamento([]);
    setFiltroNesFaturamento([]);
    setTermoBuscaEmpenhos('');
    setTermoBuscaOss('');
  };

  // 2. Filtragem e Enriquecimento das Ordens de Serviço
  const ossFiltradas = useMemo(() => {
    return ordensServico.filter((os) => {
      const projInfo = mapaProjetos.get(os.projeto_id);

      // Filtro de Projetos (Múltipla Seleção)
      if (filtroProjetos.length > 0 && !filtroProjetos.includes(String(os.projeto_id))) {
        return false;
      }

      // Filtro de Secretarias (Múltipla Seleção)
      if (
        filtroSecretarias.length > 0 &&
        (!projInfo || !filtroSecretarias.includes(projInfo.secretaria))
      ) {
        return false;
      }

      // Filtro de Anos (Múltipla Seleção)
      if (filtroAnos.length > 0 && !filtroAnos.includes(String(os.ano_referencia))) {
        return false;
      }

      // Filtro de NE de Planejamento (Múltipla Seleção)
      if (filtroNesPlanejamento.length > 0) {
        const neP = (os.ne_planejamento || '').trim();
        if (!filtroNesPlanejamento.includes(neP)) return false;
      }

      // Filtro de NE de Faturamento (Múltipla Seleção)
      if (filtroNesFaturamento.length > 0) {
        const neF = (os.ne_faturamento || '').trim();
        if (!filtroNesFaturamento.includes(neF)) return false;
      }

      // Filtro de Meses de Referência (Múltipla Seleção)
      if (filtroMeses.length > 0) {
        const mesesDaOs = mapaMesesPorOs.get(os.id);
        if (!mesesDaOs) return false;
        const temMes = Array.from(mesesDaOs).some((m) => filtroMeses.includes(m));
        if (!temMes) return false;
      }

      return true;
    });
  }, [
    ordensServico,
    mapaProjetos,
    mapaMesesPorOs,
    filtroProjetos,
    filtroSecretarias,
    filtroAnos,
    filtroNesPlanejamento,
    filtroNesFaturamento,
    filtroMeses,
  ]);

  // 3. Cálculo dos Indicadores de Destaque Obrigatórios
  // "Valor total em NE de Planejamento", "Valor total em NE de Faturamento" e "Valor total de OSs sem informação de NE"
  const metricas = useMemo(() => {
    let valorTotalNePlanejamento = 0;
    let valorTotalNeFaturamento = 0;
    let valorTotalSemNe = 0;
    let valorTotalGeral = 0;

    let qtdOssComPlanejamento = 0;
    let qtdOssComFaturamento = 0;
    let qtdOssSemNe = 0;

    const setNesPlanejamento = new Set<string>();
    const setNesFaturamento = new Set<string>();

    ossFiltradas.forEach((os) => {
      const valor = getCalculoValorTotalOS(os.id);
      valorTotalGeral += valor;

      const nePlan = (os.ne_planejamento || '').trim();
      const neFat = (os.ne_faturamento || '').trim();

      const temPlan = Boolean(nePlan);
      const temFat = Boolean(neFat);

      if (temPlan) {
        valorTotalNePlanejamento += valor;
        qtdOssComPlanejamento += 1;
        setNesPlanejamento.add(nePlan);
      }

      if (temFat) {
        valorTotalNeFaturamento += valor;
        qtdOssComFaturamento += 1;
        setNesFaturamento.add(neFat);
      }

      // OS sem informação de NE: não tem planejamento e nem faturamento, ou sem nenhuma NE
      if (!temPlan && !temFat) {
        valorTotalSemNe += valor;
        qtdOssSemNe += 1;
      }
    });

    const taxaCoberturaPlanejamento = valorTotalGeral > 0 ? (valorTotalNePlanejamento / valorTotalGeral) * 100 : 0;
    const taxaCoberturaFaturamento = valorTotalGeral > 0 ? (valorTotalNeFaturamento / valorTotalGeral) * 100 : 0;

    return {
      valorTotalNePlanejamento,
      valorTotalNeFaturamento,
      valorTotalSemNe,
      valorTotalGeral,
      qtdOssComPlanejamento,
      qtdOssComFaturamento,
      qtdOssSemNe,
      totalOss: ossFiltradas.length,
      qtdNesPlanejamentoDistintas: setNesPlanejamento.size,
      qtdNesFaturamentoDistintas: setNesFaturamento.size,
      taxaCoberturaPlanejamento,
      taxaCoberturaFaturamento,
    };
  }, [ossFiltradas, getCalculoValorTotalOS]);

  // 4. Agrupamento detalhado por Empenho (Tabela movida do Hub para cá)
  const { itensEmpenhosAgrupados, totalPlanejamentoVazio, totalFaturamentoVazio, ossPlanejamentoVazio, ossFaturamentoVazio } =
    useMemo(() => {
      const mapaPlanejamento = new Map<
        string,
        { valor: number; oss: number[]; projetos: Set<string>; secretarias: Set<string>; meses: Set<MesReferencia> }
      >();
      const mapaFaturamento = new Map<
        string,
        { valor: number; oss: number[]; projetos: Set<string>; secretarias: Set<string>; meses: Set<MesReferencia> }
      >();

      let somaPlanVazio = 0;
      const ossPlanVazio: number[] = [];

      let somaFatVazio = 0;
      const ossFatVazio: number[] = [];

      ossFiltradas.forEach((os) => {
        const valorOs = getCalculoValorTotalOS(os.id);
        const proj = mapaProjetos.get(os.projeto_id);
        const siglaProj = proj ? proj.sigla : `Projeto #${os.projeto_id}`;
        const sec = proj ? proj.secretaria : 'N/D';
        const meses = mapaMesesPorOs.get(os.id) || new Set<MesReferencia>();

        // Planejamento
        const nePlan = (os.ne_planejamento || '').trim();
        if (!nePlan) {
          somaPlanVazio += valorOs;
          ossPlanVazio.push(os.numero_os);
        } else {
          const atual = mapaPlanejamento.get(nePlan) || {
            valor: 0,
            oss: [],
            projetos: new Set<string>(),
            secretarias: new Set<string>(),
            meses: new Set<MesReferencia>(),
          };
          atual.valor += valorOs;
          atual.oss.push(os.numero_os);
          atual.projetos.add(siglaProj);
          atual.secretarias.add(sec);
          meses.forEach((m) => atual.meses.add(m));
          mapaPlanejamento.set(nePlan, atual);
        }

        // Faturamento
        const neFat = (os.ne_faturamento || '').trim();
        if (!neFat) {
          somaFatVazio += valorOs;
          ossFatVazio.push(os.numero_os);
        } else {
          const atual = mapaFaturamento.get(neFat) || {
            valor: 0,
            oss: [],
            projetos: new Set<string>(),
            secretarias: new Set<string>(),
            meses: new Set<MesReferencia>(),
          };
          atual.valor += valorOs;
          atual.oss.push(os.numero_os);
          atual.projetos.add(siglaProj);
          atual.secretarias.add(sec);
          meses.forEach((m) => atual.meses.add(m));
          mapaFaturamento.set(neFat, atual);
        }
      });

      const itens: EmpenhoAgrupado[] = [];

      // Itens de Planejamento
      Array.from(mapaPlanejamento.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([codigo_ne, dados]) => {
          itens.push({
            tipo: 'PLANEJAMENTO',
            rotulo_tipo: 'NE no Planejamento',
            codigo_ne,
            valor_total: Math.round(dados.valor * 100) / 100,
            quantidade_os: dados.oss.length,
            numeros_os: dados.oss.sort((a, b) => a - b),
            projetos_vinculados: Array.from(dados.projetos),
            secretarias_vinculadas: Array.from(dados.secretarias),
            meses_referencia: Array.from(dados.meses),
          });
        });

      // Itens de Faturamento
      Array.from(mapaFaturamento.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([codigo_ne, dados]) => {
          itens.push({
            tipo: 'FATURAMENTO',
            rotulo_tipo: 'NE no Faturamento',
            codigo_ne,
            valor_total: Math.round(dados.valor * 100) / 100,
            quantidade_os: dados.oss.length,
            numeros_os: dados.oss.sort((a, b) => a - b),
            projetos_vinculados: Array.from(dados.projetos),
            secretarias_vinculadas: Array.from(dados.secretarias),
            meses_referencia: Array.from(dados.meses),
          });
        });

      return {
        itensEmpenhosAgrupados: itens,
        totalPlanejamentoVazio: Math.round(somaPlanVazio * 100) / 100,
        totalFaturamentoVazio: Math.round(somaFatVazio * 100) / 100,
        ossPlanejamentoVazio: ossPlanVazio.sort((a, b) => a - b),
        ossFaturamentoVazio: ossFatVazio.sort((a, b) => a - b),
      };
    }, [ossFiltradas, mapaProjetos, mapaMesesPorOs, getCalculoValorTotalOS]);

  // Itens da tabela de empenhos filtrados pela busca
  const itensEmpenhosFiltrados = useMemo(() => {
    return itensEmpenhosAgrupados.filter((item) => {
      if (filtroTipoVisualizacaoTabela === 'PLANEJAMENTO' && item.tipo !== 'PLANEJAMENTO') return false;
      if (filtroTipoVisualizacaoTabela === 'FATURAMENTO' && item.tipo !== 'FATURAMENTO') return false;

      if (!termoBuscaEmpenhos.trim()) return true;
      const term = termoBuscaEmpenhos.toLowerCase().trim();
      return (
        item.codigo_ne.toLowerCase().includes(term) ||
        item.rotulo_tipo.toLowerCase().includes(term) ||
        item.projetos_vinculados.some((p) => p.toLowerCase().includes(term)) ||
        item.secretarias_vinculadas.some((s) => s.toLowerCase().includes(term)) ||
        item.numeros_os.some((n) => String(n).includes(term))
      );
    });
  }, [itensEmpenhosAgrupados, filtroTipoVisualizacaoTabela, termoBuscaEmpenhos]);

  // 5. Cruzamento para Gráficos
  // Gráfico 1: Barras Comparativas de Planejamento x Faturamento x Sem NE por Projeto ou Secretaria
  const dadosGraficoCruzamento = useMemo(() => {
    const mapa = new Map<string, { plan: number; fat: number; semNe: number }>();

    ossFiltradas.forEach((os) => {
      const valor = getCalculoValorTotalOS(os.id);
      const proj = mapaProjetos.get(os.projeto_id);
      const chave =
        visaoAgrupamentoGrafico === 'projeto'
          ? proj?.sigla || `Proj #${os.projeto_id}`
          : proj?.secretaria || 'N/D';

      if (!mapa.has(chave)) {
        mapa.set(chave, { plan: 0, fat: 0, semNe: 0 });
      }
      const entry = mapa.get(chave)!;

      const nePlan = Boolean((os.ne_planejamento || '').trim());
      const neFat = Boolean((os.ne_faturamento || '').trim());

      if (nePlan) entry.plan += valor;
      if (neFat) entry.fat += valor;
      if (!nePlan && !neFat) entry.semNe += valor;
    });

    const labels = Array.from(mapa.keys()).sort();
    const dataPlan = labels.map((l) => Math.round(mapa.get(l)!.plan * 100) / 100);
    const dataFat = labels.map((l) => Math.round(mapa.get(l)!.fat * 100) / 100);
    const dataSemNe = labels.map((l) => Math.round(mapa.get(l)!.semNe * 100) / 100);

    return { labels, dataPlan, dataFat, dataSemNe };
  }, [ossFiltradas, visaoAgrupamentoGrafico, mapaProjetos, getCalculoValorTotalOS]);

  // Inicializa Gráfico 1
  useEffect(() => {
    if (!barChartProjetoRef.current) return;
    if (barChartProjetoInstance.current) {
      barChartProjetoInstance.current.destroy();
    }
    const ctx = barChartProjetoRef.current.getContext('2d');
    if (!ctx) return;

    barChartProjetoInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dadosGraficoCruzamento.labels,
        datasets: [
          {
            label: 'Valor em NE Planejamento',
            data: dadosGraficoCruzamento.dataPlan,
            backgroundColor: '#0d6efd',
            borderRadius: 4,
          },
          {
            label: 'Valor em NE Faturamento',
            data: dadosGraficoCruzamento.dataFat,
            backgroundColor: '#198754',
            borderRadius: 4,
          },
          {
            label: 'Valor Sem Informação de NE',
            data: dadosGraficoCruzamento.dataSemNe,
            backgroundColor: '#ffc107',
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
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw as number)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: 'bold' } },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => formatCurrency(Number(val)),
              font: { size: 10 },
            },
          },
        },
      },
    });

    return () => {
      if (barChartProjetoInstance.current) barChartProjetoInstance.current.destroy();
    };
  }, [dadosGraficoCruzamento]);

  // Gráfico 2: Evolução por Meses de Referência
  const dadosGraficoMeses = useMemo(() => {
    const todosMeses = MESES_REFERENCIA;
    const mapaPlan = new Map<MesReferencia, number>();
    const mapaFat = new Map<MesReferencia, number>();

    todosMeses.forEach((m) => {
      mapaPlan.set(m, 0);
      mapaFat.set(m, 0);
    });

    alocacoes.forEach((aloc) => {
      const os = ordensServico.find((o) => o.id === aloc.ordem_servico_id);
      if (!os) return;

      // Respeita os filtros ativos de OS
      if (!ossFiltradas.some((o) => o.id === os.id)) return;

      const custo = aloc.custo_alocacao || 0;
      if ((os.ne_planejamento || '').trim()) {
        mapaPlan.set(aloc.mes_referencia, (mapaPlan.get(aloc.mes_referencia) || 0) + custo);
      }
      if ((os.ne_faturamento || '').trim()) {
        mapaFat.set(aloc.mes_referencia, (mapaFat.get(aloc.mes_referencia) || 0) + custo);
      }
    });

    return {
      labels: todosMeses,
      dataPlan: todosMeses.map((m) => Math.round((mapaPlan.get(m) || 0) * 100) / 100),
      dataFat: todosMeses.map((m) => Math.round((mapaFat.get(m) || 0) * 100) / 100),
    };
  }, [alocacoes, ordensServico, ossFiltradas]);

  // Inicializa Gráfico 2
  useEffect(() => {
    if (!lineChartMesesRef.current) return;
    if (lineChartMesesInstance.current) {
      lineChartMesesInstance.current.destroy();
    }
    const ctx = lineChartMesesRef.current.getContext('2d');
    if (!ctx) return;

    lineChartMesesInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dadosGraficoMeses.labels,
        datasets: [
          {
            label: 'Empenho Planejamento (R$)',
            data: dadosGraficoMeses.dataPlan,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
          },
          {
            label: 'Empenho Faturamento (R$)',
            data: dadosGraficoMeses.dataFat,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
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
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw as number)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => formatCurrency(Number(val)),
              font: { size: 10 },
            },
          },
          x: {
            ticks: { font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      if (lineChartMesesInstance.current) lineChartMesesInstance.current.destroy();
    };
  }, [dadosGraficoMeses]);

  // Gráfico 3: Cobertura de Empenho (Doughnut)
  useEffect(() => {
    if (!doughnutCoberturaRef.current) return;
    if (doughnutCoberturaInstance.current) {
      doughnutCoberturaInstance.current.destroy();
    }
    const ctx = doughnutCoberturaRef.current.getContext('2d');
    if (!ctx) return;

    doughnutCoberturaInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['NE Planejamento', 'NE Faturamento', 'Sem NE Cadastrada'],
        datasets: [
          {
            data: [
              metricas.valorTotalNePlanejamento,
              metricas.valorTotalNeFaturamento,
              metricas.valorTotalSemNe,
            ],
            backgroundColor: ['#0d6efd', '#198754', '#ffc107'],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${formatCurrency(context.raw as number)}`,
            },
          },
        },
        cutout: '65%',
      },
    });

    return () => {
      if (doughnutCoberturaInstance.current) doughnutCoberturaInstance.current.destroy();
    };
  }, [metricas]);

  // Exportar dados em CSV
  const handleExportCsv = () => {
    const headers = [
      'Tipo de Empenho',
      'Código da NE',
      'Valor Total OSs (R$)',
      'Quantidade de OSs',
      'Números das OSs',
      'Projetos Vinculados',
      'Secretarias Vinculadas',
    ];

    const rows = itensEmpenhosFiltrados.map((item) => [
      `"${item.rotulo_tipo}"`,
      `"${item.codigo_ne}"`,
      item.valor_total.toFixed(2),
      item.quantidade_os,
      `"${item.numeros_os.join(', ')}"`,
      `"${item.projetos_vinculados.join('; ')}"`,
      `"${item.secretarias_vinculadas.join('; ')}"`,
    ]);

    // Linhas especiais
    rows.push([
      `"NE no Planejamento Vazia / Não Informada"`,
      `"Vazio"`,
      totalPlanejamentoVazio.toFixed(2),
      ossPlanejamentoVazio.length,
      `"${ossPlanejamentoVazio.join(', ')}"`,
      `"N/A"`,
      `"N/A"`,
    ]);

    rows.push([
      `"NE no Faturamento Vazia / Não Informada"`,
      `"Vazio"`,
      totalFaturamentoVazio.toFixed(2),
      ossFaturamentoVazio.length,
      `"${ossFaturamentoVazio.join(', ')}"`,
      `"N/A"`,
      `"N/A"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `planejamento_execucao_orcamentaria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Top Header com Navegação */}
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
            <span className="badge bg-warning text-dark border border-warning-subtle fw-bold">
              Módulo 4
            </span>
            <span className="text-muted small">Finanças & Orçamento Público</span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Planejamento & Execução Orçamentária</h2>
          <p className="text-muted mb-0 small">
            Gestão estratégica das Notas de Empenho de Planejamento e Faturamento com cruzamento analítico por projetos, secretarias, OSs e meses.
          </p>
        </div>

        <div className="d-flex gap-2">
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

      {/* ================================================================ */}
      {/* INDICADORES DE DESTAQUE DO MÓDULO (Solicitados pelo usuário) */}
      {/* ================================================================ */}
      <div className="row g-3 mb-4">
        {/* Indicador 1: Valor total em NE de Planejamento */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100 border-start border-primary border-4">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="text-xs fw-bold text-uppercase text-primary tracking-wider d-block">
                    NE no Planejamento
                  </span>
                  <h6 className="text-muted small mb-0">Valor Total empenhado para execução</h6>
                </div>
                <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                  <i className="bi bi-file-earmark-text-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold text-primary mb-1 font-monospace">
                {formatCurrency(metricas.valorTotalNePlanejamento)}
              </h3>
              <div className="d-flex justify-content-between align-items-center text-muted small mt-2 pt-2 border-top">
                <span>
                  <i className="bi bi-layers me-1 text-primary"></i>
                  <strong>{metricas.qtdOssComPlanejamento}</strong> OS(s) vinculadas
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  {metricas.qtdNesPlanejamentoDistintas} NE(s) distintas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 2: Valor total em NE de Faturamento */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100 border-start border-success border-4">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="text-xs fw-bold text-uppercase text-success tracking-wider d-block">
                    NE no Faturamento
                  </span>
                  <h6 className="text-muted small mb-0">Valor Total empenhado para pagamento</h6>
                </div>
                <div className="p-2 rounded-2 bg-success-subtle text-success">
                  <i className="bi bi-check-circle-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold text-success mb-1 font-monospace">
                {formatCurrency(metricas.valorTotalNeFaturamento)}
              </h3>
              <div className="d-flex justify-content-between align-items-center text-muted small mt-2 pt-2 border-top">
                <span>
                  <i className="bi bi-receipt me-1 text-success"></i>
                  <strong>{metricas.qtdOssComFaturamento}</strong> OS(s) com faturamento
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  {metricas.qtdNesFaturamentoDistintas} NE(s) distintas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador 3: Valor total de OSs sem informação de NE */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100 border-start border-warning border-4">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="text-xs fw-bold text-uppercase text-warning tracking-wider d-block">
                    OSs sem informação de NE
                  </span>
                  <h6 className="text-muted small mb-0">Pendentes de associação orçamentária</h6>
                </div>
                <div className="p-2 rounded-2 bg-warning-subtle text-warning">
                  <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold text-warning mb-1 font-monospace">
                {formatCurrency(metricas.valorTotalSemNe)}
              </h3>
              <div className="d-flex justify-content-between align-items-center text-muted small mt-2 pt-2 border-top">
                <span>
                  <i className="bi bi-hourglass-split me-1 text-warning"></i>
                  <strong>{metricas.qtdOssSemNe}</strong> OS(s) sem qualquer NE
                </span>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                  Aguardando Empenho
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* PAINEL DE FILTROS COM MÚLTIPLA SELEÇÃO DE DADOS */}
      {/* ================================================================ */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center"
              style={{ width: 28, height: 28 }}
            >
              <i className="bi bi-funnel-fill fs-6"></i>
            </div>
            <span className="fw-bold text-dark">Filtros Dinâmicos com Múltipla Seleção</span>
            {isFiltroAtivo && (
              <span className="badge bg-warning text-dark border border-warning-subtle">
                Filtros Ativos ({[filtroProjetos, filtroSecretarias, filtroMeses, filtroAnos, filtroNesPlanejamento, filtroNesFaturamento].reduce((acc, f) => acc + (f.length > 0 ? 1 : 0), 0)})
              </span>
            )}
          </div>
          <span className="text-muted small">
            Exibindo <strong>{ossFiltradas.length}</strong> de {ordensServico.length} OSs analisadas (Valor Consolidado: {formatCurrency(metricas.valorTotalGeral)})
          </span>
        </div>

        <div className="card-body p-3 bg-light-subtle">
          <div className="row g-3">
            {/* 1. Múltipla Seleção: Secretarias */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <FiltroMultiplaSelecao
                label="Secretarias"
                opcoes={opcoesSecretarias}
                selecionados={filtroSecretarias}
                onChange={setFiltroSecretarias}
                placeholder="Todas"
                icone="bi-building"
                badgeColor="primary"
              />
            </div>

            {/* 2. Múltipla Seleção: Projetos */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <FiltroMultiplaSelecao
                label="Projetos / Unidades"
                opcoes={opcoesProjetos}
                selecionados={filtroProjetos}
                onChange={setFiltroProjetos}
                placeholder="Todos"
                icone="bi-diagram-3"
                badgeColor="primary"
              />
            </div>

            {/* 3. Múltipla Seleção: Meses de Referência */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <FiltroMultiplaSelecao
                label="Meses de Referência"
                opcoes={opcoesMeses}
                selecionados={filtroMeses}
                onChange={setFiltroMeses}
                placeholder="Todos os Meses"
                icone="bi-calendar3"
                badgeColor="success"
              />
            </div>

            {/* 4. Múltipla Seleção: Ano de Exercício */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <FiltroMultiplaSelecao
                label="Ano de Exercício"
                opcoes={opcoesAnos}
                selecionados={filtroAnos}
                onChange={setFiltroAnos}
                placeholder="Todos os Anos"
                icone="bi-calendar-event"
                badgeColor="info"
              />
            </div>

            {/* 5. Múltipla Seleção: NE Planejamento */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <FiltroMultiplaSelecao
                label="NE Planejamento"
                opcoes={opcoesNesPlanejamento}
                selecionados={filtroNesPlanejamento}
                onChange={setFiltroNesPlanejamento}
                placeholder="Todas as NEs"
                icone="bi-file-earmark-text"
                badgeColor="primary"
              />
            </div>

            {/* 6. Múltipla Seleção: NE Faturamento */}
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">
              <FiltroMultiplaSelecao
                label="NE Faturamento"
                opcoes={opcoesNesFaturamento}
                selecionados={filtroNesFaturamento}
                onChange={setFiltroNesFaturamento}
                placeholder="Todas as NEs"
                icone="bi-receipt"
                badgeColor="success"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* GRÁFICOS ANALÍTICOS DE CRUZAMENTO */}
      {/* ================================================================ */}
      <div className="row g-4 mb-4">
        {/* Gráfico 1: Cruzamento por Projetos ou Secretarias */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
            <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-bar-chart-line-fill text-primary me-2"></i>
                  Execução Orçamentária por {visaoAgrupamentoGrafico === 'projeto' ? 'Projeto / Unidade' : 'Secretaria / Órgão'}
                </h5>
                <small className="text-muted">
                  Comparativo entre Valor em Planejamento, Faturamento e Sem Informação de NE
                </small>
              </div>

              {/* Botões de Alternância de Visão */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${visaoAgrupamentoGrafico === 'projeto' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setVisaoAgrupamentoGrafico('projeto')}
                >
                  Por Projetos
                </button>
                <button
                  type="button"
                  className={`btn ${visaoAgrupamentoGrafico === 'secretaria' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setVisaoAgrupamentoGrafico('secretaria')}
                >
                  Por Secretarias
                </button>
              </div>
            </div>

            <div className="card-body p-3">
              <div style={{ minHeight: '320px', height: '320px' }}>
                <canvas ref={barChartProjetoRef}></canvas>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 3: Cobertura Global de Empenho (Doughnut) */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-pie-chart-fill text-info me-2"></i>
                Composição do Empenho
              </h5>
              <small className="text-muted">Distribuição dos valores por cobertura orçamentária</small>
            </div>

            <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center">
              <div style={{ height: '240px', width: '100%' }}>
                <canvas ref={doughnutCoberturaRef}></canvas>
              </div>

              <div className="w-100 mt-3 pt-2 border-top">
                <div className="d-flex justify-content-between align-items-center py-1 small">
                  <span className="text-muted">
                    <span className="badge bg-primary rounded-circle p-1 me-1"> </span>
                    Taxa Cobertura Planejamento:
                  </span>
                  <strong className="text-dark">{metricas.taxaCoberturaPlanejamento.toFixed(1)}%</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-1 small">
                  <span className="text-muted">
                    <span className="badge bg-success rounded-circle p-1 me-1"> </span>
                    Taxa Cobertura Faturamento:
                  </span>
                  <strong className="text-dark">{metricas.taxaCoberturaFaturamento.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Evolução Orçamentária por Meses de Referência */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-graph-up-arrow text-success me-2"></i>
                  Evolução do Empenho ao Longo dos Meses de Referência
                </h5>
                <small className="text-muted">
                  Cruzamento dos custos de alocação das OSs empenhadas mês a mês
                </small>
              </div>
              <span className="badge bg-light text-secondary border">Cronograma Físico-Financeiro</span>
            </div>

            <div className="card-body p-3">
              <div style={{ minHeight: '260px', height: '260px' }}>
                <canvas ref={lineChartMesesRef}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO ANALÍTICA: TABELA DE EMPENHOS & TABELA DE ORDENS DE SERVIÇO */}
      {/* ================================================================ */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
        <div className="card-header bg-white pt-3 pb-0 border-bottom">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-2">
            <div>
              <h5 className="fw-bold text-dark mb-1">
                <i className="bi bi-table text-primary me-2"></i>
                Detalhamento dos Empenhos & Ordens de Serviço Vinculadas
              </h5>
              <p className="text-muted small mb-0">
                Mapeamento individual de cada Nota de Empenho, valores consolidados das OSs e identificação de pendências.
              </p>
            </div>

            {/* Alternador de Abas */}
            <ul className="nav nav-tabs border-bottom-0" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link fw-semibold ${abaAtiva === 'tabela-empenhos' ? 'active text-primary' : 'text-secondary'}`}
                  type="button"
                  onClick={() => setAbaAtiva('tabela-empenhos')}
                >
                  <i className="bi bi-receipt me-1"></i>
                  Agrupamento por Empenho ({itensEmpenhosFiltrados.length})
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link fw-semibold ${abaAtiva === 'tabela-oss' ? 'active text-primary' : 'text-secondary'}`}
                  type="button"
                  onClick={() => setAbaAtiva('tabela-oss')}
                >
                  <i className="bi bi-card-checklist me-1"></i>
                  Ordens de Serviço Detalhadas ({ossFiltradas.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ABA 1: TABELA DE EMPENHOS (Movida da home do Hub e aprimorada) */}
        {/* ============================================================== */}
        {abaAtiva === 'tabela-empenhos' && (
          <div className="card-body p-3">
            {/* Controles da Tabela de Empenhos */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="small text-muted fw-bold">Tipo:</span>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${filtroTipoVisualizacaoTabela === 'TODOS' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                    onClick={() => setFiltroTipoVisualizacaoTabela('TODOS')}
                  >
                    Todos ({itensEmpenhosAgrupados.length})
                  </button>
                  <button
                    type="button"
                    className={`btn ${filtroTipoVisualizacaoTabela === 'PLANEJAMENTO' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                    onClick={() => setFiltroTipoVisualizacaoTabela('PLANEJAMENTO')}
                  >
                    Planejamento
                  </button>
                  <button
                    type="button"
                    className={`btn ${filtroTipoVisualizacaoTabela === 'FATURAMENTO' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                    onClick={() => setFiltroTipoVisualizacaoTabela('FATURAMENTO')}
                  >
                    Faturamento
                  </button>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Buscar por código NE, projeto, secretaria ou OS..."
                    value={termoBuscaEmpenhos}
                    onChange={(e) => setTermoBuscaEmpenhos(e.target.value)}
                  />
                  {termoBuscaEmpenhos && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setTermoBuscaEmpenhos('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabela de Empenhos com as Linhas Solicitadas */}
            <div className="table-responsive border rounded-3">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">#</th>
                    <th style={{ minWidth: '220px' }}>Tipo de Empenho</th>
                    <th style={{ minWidth: '180px' }}>Código da Nota de Empenho (NE)</th>
                    <th style={{ minWidth: '160px' }}>Projetos / Secretarias</th>
                    <th style={{ minWidth: '130px' }} className="text-center">OSs Vinculadas</th>
                    <th style={{ minWidth: '170px' }} className="text-end">Somatório do Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itensEmpenhosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        <i className="bi bi-inbox fs-3 d-block mb-2 text-secondary"></i>
                        Nenhum empenho encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    itensEmpenhosFiltrados.map((item, idx) => {
                      const isPlan = item.tipo === 'PLANEJAMENTO';
                      return (
                        <tr key={`${item.tipo}-${item.codigo_ne}`}>
                          <td className="text-center text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span
                                className={`badge ${isPlan ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-success-subtle text-success border border-success-subtle'} py-1 px-2`}
                              >
                                <i className={`bi ${isPlan ? 'bi-file-earmark-text' : 'bi-receipt'} me-1`}></i>
                                {item.rotulo_tipo}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="fw-bold text-dark font-monospace">
                              {item.codigo_ne}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {item.projetos_vinculados.map((proj) => (
                                <span key={proj} className="badge bg-light text-dark border small">
                                  {proj}
                                </span>
                              ))}
                              {item.secretarias_vinculadas.map((sec) => (
                                <span key={sec} className="badge bg-secondary-subtle text-secondary small">
                                  {sec}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-dark-subtle text-dark border">
                              {item.quantidade_os} OS(s)
                            </span>
                            <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                              OS: {item.numeros_os.join(', ')}
                            </div>
                          </td>
                          <td className="text-end">
                            <span className="fw-bold font-monospace text-dark fs-6">
                              {formatCurrency(item.valor_total)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* ============================================================== */}
                  {/* DUAS ÚLTIMAS LINHAS DA TABELA: CAMPOS DE NE VAZIOS */}
                  {/* ============================================================== */}
                  {/* Linha Especial 1: NE no Planejamento Vazia */}
                  <tr className="table-warning border-top border-warning-subtle">
                    <td className="text-center">
                      <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-warning text-dark border border-warning-subtle py-1 px-2 fw-bold">
                          <i className="bi bi-file-earmark-x me-1"></i>
                          NE no Planejamento
                        </span>
                        <span className="badge bg-white text-secondary border small">Campo Vazio</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted fst-italic small">
                        [ Sem informação de NE de Planejamento ]
                      </span>
                    </td>
                    <td>
                      <span className="text-muted small">
                        Ordens de Serviço sem número de empenho de planejamento
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-warning text-dark border border-warning-subtle">
                        {ossPlanejamentoVazio.length} OS(s)
                      </span>
                      {ossPlanejamentoVazio.length > 0 && (
                        <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                          OS: {ossPlanejamentoVazio.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <span className="fw-bold font-monospace text-dark fs-6">
                        {formatCurrency(totalPlanejamentoVazio)}
                      </span>
                    </td>
                  </tr>

                  {/* Linha Especial 2: NE no Faturamento Vazia */}
                  <tr className="table-warning border-top border-warning-subtle">
                    <td className="text-center">
                      <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-warning text-dark border border-warning-subtle py-1 px-2 fw-bold">
                          <i className="bi bi-receipt-cutoff me-1"></i>
                          NE no Faturamento
                        </span>
                        <span className="badge bg-white text-secondary border small">Campo Vazio</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted fst-italic small">
                        [ Sem informação de NE de Faturamento ]
                      </span>
                    </td>
                    <td>
                      <span className="text-muted small">
                        Ordens de Serviço sem número de empenho de faturamento
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-warning text-dark border border-warning-subtle">
                        {ossFaturamentoVazio.length} OS(s)
                      </span>
                      {ossFaturamentoVazio.length > 0 && (
                        <div className="small text-muted mt-1" style={{ fontSize: '11px' }}>
                          OS: {ossFaturamentoVazio.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <span className="fw-bold font-monospace text-dark fs-6">
                        {formatCurrency(totalFaturamentoVazio)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: TABELA DE ORDENS DE SERVIÇO DETALHADAS */}
        {/* ============================================================== */}
        {abaAtiva === 'tabela-oss' && (
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small text-muted">
                Listagem detalhada das <strong>{ossFiltradas.length}</strong> ordens de serviço correspondentes aos filtros.
              </span>
              <div className="col-12 col-md-4">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Pesquisar por OS, projeto, SEI ou NE..."
                  value={termoBuscaOss}
                  onChange={(e) => setTermoBuscaOss(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive border rounded-3">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>OS</th>
                    <th>Projeto / Secretaria</th>
                    <th>NE Planejamento</th>
                    <th>NE Faturamento</th>
                    <th>Processo SEI</th>
                    <th>Situação SGC</th>
                    <th className="text-end">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ossFiltradas
                    .filter((os) => {
                      if (!termoBuscaOss.trim()) return true;
                      const q = termoBuscaOss.toLowerCase().trim();
                      const proj = mapaProjetos.get(os.projeto_id);
                      return (
                        String(os.numero_os).includes(q) ||
                        (proj && proj.sigla.toLowerCase().includes(q)) ||
                        (proj && proj.secretaria.toLowerCase().includes(q)) ||
                        (os.ne_planejamento && os.ne_planejamento.toLowerCase().includes(q)) ||
                        (os.ne_faturamento && os.ne_faturamento.toLowerCase().includes(q)) ||
                        (os.processo_sei_pagamento && os.processo_sei_pagamento.toLowerCase().includes(q))
                      );
                    })
                    .map((os) => {
                      const proj = mapaProjetos.get(os.projeto_id);
                      const valorOs = getCalculoValorTotalOS(os.id);
                      return (
                        <tr key={os.id}>
                          <td>
                            <span className="fw-bold text-primary font-monospace">
                              OS #{os.numero_os}
                            </span>
                            <div className="small text-muted">{os.ano_referencia}</div>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{proj?.sigla || `Projeto #${os.projeto_id}`}</div>
                            <span className="badge bg-secondary-subtle text-secondary small">
                              {proj?.secretaria}
                            </span>
                          </td>
                          <td>
                            {os.ne_planejamento ? (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                                {os.ne_planejamento}
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border fst-italic">Vazio</span>
                            )}
                          </td>
                          <td>
                            {os.ne_faturamento ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace">
                                {os.ne_faturamento}
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border fst-italic">Vazio</span>
                            )}
                          </td>
                          <td>
                            <span className="font-monospace small text-dark">
                              {os.processo_sei_pagamento || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border">
                              {os.situacao_sgc || 'N/D'}
                            </span>
                          </td>
                          <td className="text-end">
                            <span className="fw-bold font-monospace text-dark">
                              {formatCurrency(valorOs)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
