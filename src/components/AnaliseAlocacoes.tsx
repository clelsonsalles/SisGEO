import React, { useState, useMemo } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { OrdemServico, AlocacaoPerfilOs, MESES_REFERENCIA, MesReferencia } from '../types/models';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { FiltroMultiplaSelecao, OpcaoFiltro } from './dashboard/FiltroMultiplaSelecao';
import { OrdemServicoModal } from './OrdemServicoModal';
import { AlocacaoModal } from './AlocacaoModal';
import { ActiveTab } from './Navbar';
import { baixarRelatorioGerencialAlocacoesPDF } from '../utils/relatorioAlocacoesPdf';
import { baixarRelatorioConsolidadoAlocacoesPDF } from '../utils/relatorioConsolidadoAlocacoesPdf';

interface AnaliseAlocacoesProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const AnaliseAlocacoes: React.FC<AnaliseAlocacoesProps> = ({ onNavigate }) => {
  const {
    ordensServico,
    projetos,
    perfis,
    alocacoes,
    getCalculoValorTotalOS,
    getSituacoesSgcDoBanco,
    getSituacoesPassivoDoBanco,
  } = useSisgos();

  // Estados dos Modais de Edição
  const [editingOs, setEditingOs] = useState<OrdemServico | null>(null);
  const [isOsModalOpen, setIsOsModalOpen] = useState<boolean>(false);

  const [selectedOsForAlocacao, setSelectedOsForAlocacao] = useState<OrdemServico | null>(null);
  const [isAlocacaoModalOpen, setIsAlocacaoModalOpen] = useState<boolean>(false);

  // Estados dos Filtros com MÚLTIPLA SELEÇÃO (idênticos aos do Dashboard Analítico)
  const [filtroSecretarias, setFiltroSecretarias] = useState<string[]>([]);
  const [filtroProjetos, setFiltroProjetos] = useState<string[]>([]);
  const [filtroAnos, setFiltroAnos] = useState<string[]>([]);
  const [filtroMeses, setFiltroMeses] = useState<string[]>([]);
  const [filtroSituacoesSgc, setFiltroSituacoesSgc] = useState<string[]>([]);
  const [filtroSituacoesPassivo, setFiltroSituacoesPassivo] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Controle de recolhimento dos cartões de meses e projetos
  const [mesesRecolhidos, setMesesRecolhidos] = useState<Record<string, boolean>>({});
  const [projetosRecolhidos, setProjetosRecolhidos] = useState<Record<string, boolean>>({});

  // Estado de geração dos relatórios PDF
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingConsolidadoPdf, setIsGeneratingConsolidadoPdf] = useState<boolean>(false);

  // 1. Opções dinâmicas para os filtros de múltipla seleção
  const opcoesSecretarias: OpcaoFiltro[] = useMemo(() => {
    const secMap = new Map<string, string>();
    projetos.forEach((p) => {
      secMap.set(p.sigla_secretaria.trim().toUpperCase(), p.nome_secretaria.trim());
    });
    return Array.from(secMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sigla, nome]) => ({
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
    return projs
      .sort((a, b) => a.sigla_projeto.localeCompare(b.sigla_projeto))
      .map((p) => ({
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

  const opcoesMeses: OpcaoFiltro[] = useMemo(() => {
    return MESES_REFERENCIA.map((mes) => {
      const count = alocacoes.filter((a) => a.mes_referencia.toUpperCase() === mes).length;
      return {
        value: mes,
        label: mes,
        count,
      };
    });
  }, [alocacoes]);

  const opcoesSituacoesSgc: OpcaoFiltro[] = useMemo(() => {
    const situacoes = getSituacoesSgcDoBanco();
    return situacoes.map((sit) => ({
      value: sit,
      label: sit,
    }));
  }, [getSituacoesSgcDoBanco]);

  const opcoesSituacoesPassivo: OpcaoFiltro[] = useMemo(() => {
    const situacoes = getSituacoesPassivoDoBanco();
    const list: OpcaoFiltro[] = situacoes.map((sit) => ({
      value: sit,
      label: sit,
    }));

    const hasSemPassivo = ordensServico.some(
      (os) => !os.situacao_passivo_2026 || !os.situacao_passivo_2026.trim() || os.situacao_passivo_2026.trim().toUpperCase() === 'NULL'
    );
    if (hasSemPassivo) {
      list.push({
        value: '__SEM_PASSIVO__',
        label: '(Não informado)',
      });
    }

    return list;
  }, [ordensServico, getSituacoesPassivoDoBanco]);

  // Limpeza de filtros
  const handleLimparFiltros = () => {
    setFiltroSecretarias([]);
    setFiltroProjetos([]);
    setFiltroAnos([]);
    setFiltroMeses([]);
    setFiltroSituacoesSgc([]);
    setFiltroSituacoesPassivo([]);
    setTermoBusca('');
  };

  const isFiltroAtivo =
    filtroSecretarias.length > 0 ||
    filtroProjetos.length > 0 ||
    filtroAnos.length > 0 ||
    filtroMeses.length > 0 ||
    filtroSituacoesSgc.length > 0 ||
    filtroSituacoesPassivo.length > 0 ||
    termoBusca.trim() !== '';

  const totalFiltrosAtivosCount =
    (filtroSecretarias.length > 0 ? 1 : 0) +
    (filtroProjetos.length > 0 ? 1 : 0) +
    (filtroAnos.length > 0 ? 1 : 0) +
    (filtroMeses.length > 0 ? 1 : 0) +
    (filtroSituacoesSgc.length > 0 ? 1 : 0) +
    (filtroSituacoesPassivo.length > 0 ? 1 : 0) +
    (termoBusca.trim() !== '' ? 1 : 0);

  // Mapas rápidos para performance
  const mapaProjetos = useMemo(() => new Map(projetos.map((p) => [p.id, p])), [projetos]);
  const mapaPerfis = useMemo(() => new Map(perfis.map((p) => [p.id, p])), [perfis]);
  const mapaOS = useMemo(() => new Map(ordensServico.map((os) => [os.id, os])), [ordensServico]);

  // 2. Filtragem de alocações e estrutura agrupada
  // Estrutura hierárquica: Mês -> Projeto -> Ordem de Serviço -> Alocações
  const dadosAgrupados = useMemo(() => {
    const termo = termoBusca.toLowerCase().trim();

    // Filtra todas as alocações elegíveis
    const alocacoesFiltradas = alocacoes.filter((aloc) => {
      const os = mapaOS.get(aloc.ordem_servico_id);
      if (!os) return false;

      const proj = mapaProjetos.get(os.projeto_id);
      if (!proj) return false;

      const perfil = mapaPerfis.get(aloc.perfil_contratado_id);

      // Filtro Secretaria
      if (
        filtroSecretarias.length > 0 &&
        !filtroSecretarias.includes(proj.sigla_secretaria.trim().toUpperCase())
      ) {
        return false;
      }

      // Filtro Projeto
      if (
        filtroProjetos.length > 0 &&
        !filtroProjetos.includes(String(proj.id))
      ) {
        return false;
      }

      // Filtro Ano
      if (
        filtroAnos.length > 0 &&
        !filtroAnos.includes(String(os.ano_referencia))
      ) {
        return false;
      }

      // Filtro Mês
      if (
        filtroMeses.length > 0 &&
        !filtroMeses.includes(aloc.mes_referencia.toUpperCase())
      ) {
        return false;
      }

      // Filtro Situação SGC
      if (
        filtroSituacoesSgc.length > 0 &&
        !filtroSituacoesSgc.includes((os.situacao_sgc || '').trim())
      ) {
        return false;
      }

      // Filtro Situação Passivo 2026
      if (filtroSituacoesPassivo.length > 0) {
        const passivo = (os.situacao_passivo_2026 || '').trim();
        const isSemPassivo = !passivo || passivo.toUpperCase() === 'NULL';
        const matchValor = filtroSituacoesPassivo.includes(passivo);
        const matchSemPassivo = filtroSituacoesPassivo.includes('__SEM_PASSIVO__') && isSemPassivo;
        if (!matchValor && !matchSemPassivo) {
          return false;
        }
      }

      // Busca Textual Livre
      if (termo) {
        const matchOS = String(os.numero_os).includes(termo) || String(os.ano_referencia).includes(termo);
        const matchProf = (aloc.nome_profissional || '').toLowerCase().includes(termo);
        const matchProj =
          (proj.nome_projeto || '').toLowerCase().includes(termo) ||
          (proj.sigla_projeto || '').toLowerCase().includes(termo) ||
          (proj.sigla_secretaria || '').toLowerCase().includes(termo);
        const matchPerfil =
          (perfil?.nome_perfil || '').toLowerCase().includes(termo) ||
          (perfil?.item_contratacao || '').toLowerCase().includes(termo);
        const matchDoc = (aloc.documento_referencia || '').toLowerCase().includes(termo);

        if (!matchOS && !matchProf && !matchProj && !matchPerfil && !matchDoc) {
          return false;
        }
      }

      return true;
    });

    // Agrupamento por Mês
    type EstruturaOS = {
      os: OrdemServico;
      alocacoes: AlocacaoPerfilOs[];
      custoTotalAlocacoesMes: number;
      valorTotalGeralOS: number;
    };

    type EstruturaProjeto = {
      projeto: typeof projetos[0];
      ordens: Map<number, EstruturaOS>;
      custoTotalProjetoMes: number;
      totalAlocacoesProjetoMes: number;
    };

    type EstruturaMes = {
      mes: MesReferencia;
      projetos: Map<number, EstruturaProjeto>;
      custoTotalMes: number;
      totalAlocacoesMes: number;
      profissionaisDistintosMes: Set<string>;
    };

    const mesesMap = new Map<MesReferencia, EstruturaMes>();

    // Inicializa todos os meses de referência se desejado ou apenas os que têm dados
    // Vamos preencher apenas os meses que possuem dados filtrados, respeitando a ordem cronológica
    MESES_REFERENCIA.forEach((m) => {
      mesesMap.set(m, {
        mes: m,
        projetos: new Map(),
        custoTotalMes: 0,
        totalAlocacoesMes: 0,
        profissionaisDistintosMes: new Set(),
      });
    });

    // Distribui cada alocação filtrada na árvore
    alocacoesFiltradas.forEach((aloc) => {
      const mesRef = aloc.mes_referencia.toUpperCase() as MesReferencia;
      const mesData = mesesMap.get(mesRef);
      if (!mesData) return;

      const os = mapaOS.get(aloc.ordem_servico_id);
      if (!os) return;
      const proj = mapaProjetos.get(os.projeto_id);
      if (!proj) return;

      // Incrementa métricas do mês
      mesData.custoTotalMes += aloc.custo_alocacao || 0;
      mesData.totalAlocacoesMes += 1;
      if (aloc.nome_profissional) {
        mesData.profissionaisDistintosMes.add(aloc.nome_profissional.trim().toUpperCase());
      }

      // Projeto dentro do mês
      let projData = mesData.projetos.get(proj.id);
      if (!projData) {
        projData = {
          projeto: proj,
          ordens: new Map(),
          custoTotalProjetoMes: 0,
          totalAlocacoesProjetoMes: 0,
        };
        mesData.projetos.set(proj.id, projData);
      }
      projData.custoTotalProjetoMes += aloc.custo_alocacao || 0;
      projData.totalAlocacoesProjetoMes += 1;

      // OS dentro do projeto
      let osData = projData.ordens.get(os.id);
      if (!osData) {
        osData = {
          os,
          alocacoes: [],
          custoTotalAlocacoesMes: 0,
          valorTotalGeralOS: getCalculoValorTotalOS(os.id),
        };
        projData.ordens.set(os.id, osData);
      }
      osData.alocacoes.push(aloc);
      osData.custoTotalAlocacoesMes += aloc.custo_alocacao || 0;
    });

    // Converte os meses com alocações em um array ordenado cronologicamente
    const mesesComDados = MESES_REFERENCIA.map((m) => mesesMap.get(m)!)
      .filter((m) => m && m.totalAlocacoesMes > 0)
      .map((m) => ({
        mes: m.mes,
        custoTotalMes: m.custoTotalMes,
        totalAlocacoesMes: m.totalAlocacoesMes,
        totalProfissionais: m.profissionaisDistintosMes.size,
        projetos: Array.from(m.projetos.values())
          .sort((a, b) => a.projeto.sigla_projeto.localeCompare(b.projeto.sigla_projeto))
          .map((p) => ({
            projeto: p.projeto,
            custoTotalProjetoMes: p.custoTotalProjetoMes,
            totalAlocacoesProjetoMes: p.totalAlocacoesProjetoMes,
            ordens: Array.from(p.ordens.values())
              .sort((a, b) => a.os.numero_os - b.os.numero_os)
              .map((o) => ({
                ...o,
                alocacoes: o.alocacoes.sort((a, b) =>
                  a.nome_profissional.localeCompare(b.nome_profissional)
                ),
              })),
          })),
      }));

    // Métricas gerais filtradas
    const totalCustoGeral = alocacoesFiltradas.reduce((acc, curr) => acc + (curr.custo_alocacao || 0), 0);
    const totalProfissionaisGeral = new Set(
      alocacoesFiltradas.map((a) => a.nome_profissional.trim().toUpperCase()).filter(Boolean)
    ).size;
    const totalOSsGeral = new Set(alocacoesFiltradas.map((a) => a.ordem_servico_id)).size;
    const totalProjetosGeral = new Set(
      alocacoesFiltradas
        .map((a) => {
          const os = mapaOS.get(a.ordem_servico_id);
          return os ? os.projeto_id : null;
        })
        .filter(Boolean)
    ).size;

    return {
      meses: mesesComDados,
      totalAlocacoes: alocacoesFiltradas.length,
      totalCustoGeral,
      totalProfissionaisGeral,
      totalOSsGeral,
      totalProjetosGeral,
    };
  }, [
    alocacoes,
    ordensServico,
    projetos,
    perfis,
    mapaOS,
    mapaProjetos,
    mapaPerfis,
    filtroSecretarias,
    filtroProjetos,
    filtroAnos,
    filtroMeses,
    filtroSituacoesSgc,
    filtroSituacoesPassivo,
    termoBusca,
    getCalculoValorTotalOS,
  ]);

  // Controles de colapso de cartões
  const toggleRecolherMes = (mes: string) => {
    setMesesRecolhidos((prev) => ({
      ...prev,
      [mes]: !prev[mes],
    }));
  };

  const toggleRecolherProjeto = (key: string) => {
    setProjetosRecolhidos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandirTodos = () => {
    setMesesRecolhidos({});
    setProjetosRecolhidos({});
  };

  const recolherTodos = () => {
    const todosMeses: Record<string, boolean> = {};
    const todosProjetos: Record<string, boolean> = {};
    dadosAgrupados.meses.forEach((m) => {
      todosMeses[m.mes] = true;
      m.projetos.forEach((p) => {
        todosProjetos[`${m.mes}-${p.projeto.id}`] = true;
      });
    });
    setMesesRecolhidos(todosMeses);
    setProjetosRecolhidos(todosProjetos);
  };

  // Funções para abrir os modais de edição
  const handleEditarOs = (os: OrdemServico) => {
    setEditingOs(os);
    setIsOsModalOpen(true);
  };

  const handleEditarAlocacoes = (os: OrdemServico) => {
    setSelectedOsForAlocacao(os);
    setIsAlocacaoModalOpen(true);
  };

  // Geração do Relatório Gerencial em PDF
  const handleGerarRelatorioPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        baixarRelatorioGerencialAlocacoesPDF({
          filtros: {
            secretarias: filtroSecretarias,
            projetosIds: filtroProjetos,
            anos: filtroAnos,
            meses: filtroMeses,
            situacoesSgc: filtroSituacoesSgc,
            situacoesPassivo: filtroSituacoesPassivo,
            termoBusca,
          },
          dados: dadosAgrupados,
          todosProjetos: projetos,
          todosPerfis: perfis,
        });
      } catch (err) {
        console.error('Erro ao gerar relatório em PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 50);
  };

  // Geração do Relatório Consolidado das Alocações em PDF
  const handleGerarRelatorioConsolidadoPDF = () => {
    setIsGeneratingConsolidadoPdf(true);
    setTimeout(() => {
      try {
        baixarRelatorioConsolidadoAlocacoesPDF({
          filtros: {
            secretarias: filtroSecretarias,
            projetosIds: filtroProjetos,
            anos: filtroAnos,
            meses: filtroMeses,
            situacoesSgc: filtroSituacoesSgc,
            situacoesPassivo: filtroSituacoesPassivo,
            termoBusca,
          },
          alocacoes,
          ordensServico,
          projetos,
          perfis,
        });
      } catch (err) {
        console.error('Erro ao gerar relatório consolidado em PDF:', err);
      } finally {
        setIsGeneratingConsolidadoPdf(false);
      }
    }, 50);
  };

  // Helper de badges para Situação SGC
  const getSgcBadgeClass = (situacao: string) => {
    const s = (situacao || '').toUpperCase();
    if (s.includes('EXECUÇÃO') || s.includes('EM EXECUCAO')) return 'bg-success text-white';
    if (s.includes('PLANEJADA') || s.includes('PLANEJAMENTO')) return 'bg-primary text-white';
    if (s.includes('CONCLUÍDA') || s.includes('CONCLUIDA')) return 'bg-info text-dark';
    if (s.includes('CANCELADA')) return 'bg-danger text-white';
    if (s.includes('PENDENTE')) return 'bg-warning text-dark';
    return 'bg-secondary text-white';
  };

  // Helper de badges para Passivo 2026
  const getPassivoBadgeClass = (passivo?: string | null) => {
    const p = (passivo || '').toUpperCase();
    if (!p || p === 'NULL') return 'bg-light text-muted border';
    if (p.includes('CONFIRMADO') || p.includes('PAGO') || p.includes('SIM')) return 'bg-success-subtle text-success border border-success-subtle';
    if (p.includes('PENDENTE') || p.includes('ANÁLISE')) return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    if (p.includes('GLOSADO') || p.includes('NÃO') || p.includes('CANCELADO')) return 'bg-danger-subtle text-danger border border-danger-subtle';
    return 'bg-info-subtle text-info-emphasis border border-info-subtle';
  };

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      {/* 1. Header da Seção */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-info text-dark rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: 40, height: 40 }}
            >
              <i className="bi bi-people-fill fs-5"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h4 fw-bold mb-0 text-dark">Análise de Alocações</h1>
                <span className="badge bg-info text-dark fw-bold">Mês • Projeto • OS</span>
              </div>
              <small className="text-muted">
                Visão detalhada das alocações de profissionais agrupadas por mês de referência, projeto e ordem de serviço
              </small>
            </div>
          </div>
        </div>

        {/* Ações rápidas do Header */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              onClick={expandirTodos}
              title="Expandir todos os cartões mensais e de projetos"
            >
              <i className="bi bi-arrows-expand"></i>
              <span className="d-none d-sm-inline">Expandir Todos</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              onClick={recolherTodos}
              title="Recolher todos os cartões"
            >
              <i className="bi bi-arrows-collapse"></i>
              <span className="d-none d-sm-inline">Recolher Todos</span>
            </button>
          </div>

          {onNavigate && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => onNavigate('gestao-os')}
              title="Ir para a listagem tabular de Ordens de Serviço"
            >
              <i className="bi bi-clipboard2-check"></i>
              <span>Gestão de OSs</span>
            </button>
          )}

          {onNavigate && (
            <button
              type="button"
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
              onClick={() => onNavigate('dashboard-analitico')}
              title="Ir para o Dashboard Analítico e gráficos"
            >
              <i className="bi bi-bar-chart-line-fill"></i>
              <span>Dashboard BI</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Painel de Filtros com MÚLTIPLA SELEÇÃO (Mesmos do Dashboard Analítico) */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill text-primary"></i>
            <span className="fw-semibold small text-dark">Filtros de Dados com Seleção Múltipla</span>
            {isFiltroAtivo && (
              <span className="badge bg-primary rounded-pill small">
                {totalFiltrosAtivosCount} {totalFiltrosAtivosCount === 1 ? 'filtro ativo' : 'filtros ativos'}
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            {isFiltroAtivo && (
              <button
                type="button"
                className="btn btn-link btn-sm text-danger text-decoration-none p-0 d-flex align-items-center gap-1"
                onClick={handleLimparFiltros}
              >
                <i className="bi bi-x-circle-fill"></i>
                <span className="small fw-semibold">Limpar Todos os Filtros</span>
              </button>
            )}
          </div>
        </div>

        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            {/* Filtro: Secretaria */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <FiltroMultiplaSelecao
                titulo="Secretaria"
                icone="bi-building"
                badgeColor="primary"
                opcoes={opcoesSecretarias}
                selecionados={filtroSecretarias}
                onChange={setFiltroSecretarias}
                placeholder="Todas Secretarias"
              />
            </div>

            {/* Filtro: Projeto */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <FiltroMultiplaSelecao
                titulo="Projeto"
                icone="bi-folder2"
                badgeColor="success"
                opcoes={opcoesProjetos}
                selecionados={filtroProjetos}
                onChange={setFiltroProjetos}
                placeholder="Todos Projetos"
              />
            </div>

            {/* Filtro: Ano de Referência */}
            <div className="col-6 col-sm-4 col-md-4 col-lg-1">
              <FiltroMultiplaSelecao
                titulo="Ano"
                icone="bi-calendar-event"
                badgeColor="info"
                opcoes={opcoesAnos}
                selecionados={filtroAnos}
                onChange={setFiltroAnos}
                placeholder="Todos"
              />
            </div>

            {/* Filtro: Mês de Referência */}
            <div className="col-6 col-sm-4 col-md-4 col-lg-2">
              <FiltroMultiplaSelecao
                titulo="Mês"
                icone="bi-calendar3"
                badgeColor="warning"
                opcoes={opcoesMeses}
                selecionados={filtroMeses}
                onChange={setFiltroMeses}
                placeholder="Todos os Meses"
              />
            </div>

            {/* Filtro: Situação SGC */}
            <div className="col-12 col-sm-4 col-md-4 col-lg-2">
              <FiltroMultiplaSelecao
                titulo="Situação SGC"
                icone="bi-tag"
                badgeColor="secondary"
                opcoes={opcoesSituacoesSgc}
                selecionados={filtroSituacoesSgc}
                onChange={setFiltroSituacoesSgc}
                placeholder="Todas Situações"
              />
            </div>

            {/* Filtro: Passivo 2026 */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <FiltroMultiplaSelecao
                titulo="Passivo 2026"
                icone="bi-clock-history"
                badgeColor="danger"
                opcoes={opcoesSituacoesPassivo}
                selecionados={filtroSituacoesPassivo}
                onChange={setFiltroSituacoesPassivo}
                placeholder="Todas as Situações Passivo"
              />
            </div>

            {/* Campo de Busca Livre */}
            <div className="col-12 mt-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Pesquisar por nome do profissional, perfil, projeto, secretaria ou nº da OS..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
                {termoBusca && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setTermoBusca('')}
                    title="Limpar texto de busca"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Geração de Relatórios em PDF (Logo após apresentação dos filtros) */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 p-3 bg-white border rounded-3 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="d-inline-flex p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
            <i className="bi bi-file-earmark-bar-graph-fill fs-4"></i>
          </div>
          <div>
            <div className="fw-semibold text-dark">Relatórios Oficiais em PDF</div>
            <div className="text-muted small">
              Exporte relatórios consolidados com dashboards e gráficos, ou o relatório detalhado por mês, projeto e OS
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
            onClick={handleGerarRelatorioConsolidadoPDF}
            disabled={isGeneratingConsolidadoPdf}
            title="Exportar relatório gerencial consolidado com dashboards, tabelas e gráficos dos 5 indicadores"
          >
            {isGeneratingConsolidadoPdf ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Gerando Consolidado...</span>
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-bar-graph-fill fs-5"></i>
                <span>Gerar Relatório Consolidado das  Alocações</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline-danger d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
            onClick={handleGerarRelatorioPDF}
            disabled={isGeneratingPdf}
            title="Exportar relatório gerencial em PDF com filtros aplicados e detalhamento de profissionais"
          >
            {isGeneratingPdf ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Gerando Detalhado...</span>
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                <span>Gerar Relatório Gerencial das Alocações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Indicadores Resumo dos Resultados Filtrados */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm bg-primary text-white p-3 rounded-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-white-50 small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                  Alocações Filtradas
                </div>
                <div className="fs-3 fw-bold">{formatNumber(dadosAgrupados.totalAlocacoes)}</div>
              </div>
              <div className="bg-white/20 rounded-circle p-2 text-white">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
            <div className="small text-white-50 mt-1" style={{ fontSize: '11px' }}>
              Em {dadosAgrupados.meses.length} {dadosAgrupados.meses.length === 1 ? 'mês' : 'meses'} com alocações
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm bg-success text-white p-3 rounded-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-white-50 small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                  Custo Total no Período
                </div>
                <div className="fs-4 fw-bold font-monospace">{formatCurrency(dadosAgrupados.totalCustoGeral)}</div>
              </div>
              <div className="bg-white/20 rounded-circle p-2 text-white">
                <i className="bi bi-cash-stack fs-4"></i>
              </div>
            </div>
            <div className="small text-white-50 mt-1" style={{ fontSize: '11px' }}>
              Soma das alocações mensais filtradas
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm bg-info text-dark p-3 rounded-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-dark-50 small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                  Profissionais Distintos
                </div>
                <div className="fs-3 fw-bold">{formatNumber(dadosAgrupados.totalProfissionaisGeral)}</div>
              </div>
              <div className="bg-dark/10 rounded-circle p-2 text-dark">
                <i className="bi bi-person-check-fill fs-4"></i>
              </div>
            </div>
            <div className="small text-dark-50 mt-1" style={{ fontSize: '11px' }}>
              Pessoas físicas alocadas na equipe
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm bg-dark text-white p-3 rounded-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-white-50 small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>
                  Projetos & OSs
                </div>
                <div className="fs-4 fw-bold">
                  {dadosAgrupados.totalProjetosGeral} Proj. • {dadosAgrupados.totalOSsGeral} OSs
                </div>
              </div>
              <div className="bg-white/20 rounded-circle p-2 text-white">
                <i className="bi bi-diagram-3-fill fs-4"></i>
              </div>
            </div>
            <div className="small text-white-50 mt-1" style={{ fontSize: '11px' }}>
              Contratos governamentais impactados
            </div>
          </div>
        </div>
      </div>

      {/* 4. Estrutura Hierárquica de Cartões: Mês -> Projeto -> OS -> Alocações */}
      {dadosAgrupados.meses.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-white my-4">
          <div className="text-muted mb-3">
            <i className="bi bi-calendar-x fs-1 text-secondary opacity-50"></i>
          </div>
          <h4 className="fw-bold text-secondary">Nenhuma alocação encontrada</h4>
          <p className="text-muted small mx-auto" style={{ maxWidth: '480px' }}>
            Não encontramos alocações correspondentes aos filtros aplicados. Tente ajustar os filtros de secretaria,
            projeto, ano, mês ou limpar o termo de busca.
          </p>
          {isFiltroAtivo && (
            <div>
              <button
                type="button"
                className="btn btn-primary btn-sm px-4 fw-semibold"
                onClick={handleLimparFiltros}
              >
                <i className="bi bi-x-circle me-1"></i>Limpar Filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {dadosAgrupados.meses.map((mesData) => {
            const isMesRecolhido = !!mesesRecolhidos[mesData.mes];

            return (
              <div
                key={mesData.mes}
                className="card border-0 shadow-sm overflow-hidden"
                style={{ borderRadius: '12px', borderLeft: '5px solid #0d6efd' }}
              >
                {/* Cabeçalho do Cartão Mensal */}
                <div
                  className="card-header bg-gradient bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleRecolherMes(mesData.mes)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleRecolherMes(mesData.mes);
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center shadow-sm fw-bold"
                      style={{ width: 44, height: 44 }}
                    >
                      <i className="bi bi-calendar3 fs-5"></i>
                    </span>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h2 className="h5 fw-bold mb-0 text-white tracking-wide">
                          {mesData.mes}
                        </h2>
                        <span className="badge bg-white/20 text-white border border-white/30 small">
                          {mesData.projetos.length} {mesData.projetos.length === 1 ? 'projeto' : 'projetos'}
                        </span>
                      </div>
                      <div className="small text-white-50 mt-0.5">
                        {mesData.totalAlocacoesMes} {mesData.totalAlocacoesMes === 1 ? 'alocação' : 'alocações'} •{' '}
                        {mesData.totalProfissionais} profissionais na equipe
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end d-none d-sm-block">
                      <div className="small text-white-50">Custo Total no Mês</div>
                      <div className="fw-bold font-monospace fs-5 text-white">
                        {formatCurrency(mesData.custoTotalMes)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-light btn-sm text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                      style={{ width: 34, height: 34 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecolherMes(mesData.mes);
                      }}
                      aria-label={isMesRecolhido ? 'Expandir mês' : 'Recolher mês'}
                      title={isMesRecolhido ? 'Expandir mês' : 'Recolher mês'}
                    >
                      <i className={`bi ${isMesRecolhido ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Mês (Lista de Cartões de Projetos) */}
                {!isMesRecolhido && (
                  <div className="card-body p-3 p-md-4 bg-slate-50/50">
                    <div className="d-flex flex-column gap-3">
                      {mesData.projetos.map((projData) => {
                        const projKey = `${mesData.mes}-${projData.projeto.id}`;
                        const isProjRecolhido = !!projetosRecolhidos[projKey];

                        return (
                          <div
                            key={projKey}
                            className="card border shadow-sm bg-white overflow-hidden rounded-3"
                          >
                            {/* Cabeçalho do Cartão de Projeto */}
                            <div
                              className="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleRecolherProjeto(projKey)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleRecolherProjeto(projKey);
                                }
                              }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-dark text-white fw-bold px-2 py-1">
                                  {projData.projeto.sigla_secretaria}
                                </span>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <h3 className="h6 fw-bold mb-0 text-dark">
                                    {projData.projeto.sigla_projeto}
                                  </h3>
                                  <span className="text-muted small d-none d-md-inline">
                                    — {projData.projeto.nome_projeto}
                                  </span>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-3">
                                <span className="badge bg-secondary-subtle text-secondary small">
                                  {projData.ordens.length} {projData.ordens.length === 1 ? 'OS' : 'OSs'} •{' '}
                                  {projData.totalAlocacoesProjetoMes} {projData.totalAlocacoesProjetoMes === 1 ? 'alocação' : 'alocações'}
                                </span>

                                <div className="text-end">
                                  <span className="small text-muted me-1 d-none d-sm-inline">Total:</span>
                                  <strong className="text-success font-monospace small">
                                    {formatCurrency(projData.custoTotalProjetoMes)}
                                  </strong>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm p-1 d-flex align-items-center justify-content-center"
                                  style={{ width: 26, height: 26 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRecolherProjeto(projKey);
                                  }}
                                  aria-label={isProjRecolhido ? 'Expandir projeto' : 'Recolher projeto'}
                                >
                                  <i className={`bi ${isProjRecolhido ? 'bi-chevron-down' : 'bi-chevron-up'}`} style={{ fontSize: '11px' }}></i>
                                </button>
                              </div>
                            </div>

                            {/* Conteúdo do Projeto: Cartões de cada Ordem de Serviço */}
                            {!isProjRecolhido && (
                              <div className="card-body p-3">
                                <div className="row g-3">
                                  {projData.ordens.map((osItem) => {
                                    const { os, alocacoes: osAlocs, custoTotalAlocacoesMes, valorTotalGeralOS } = osItem;

                                    return (
                                      <div key={os.id} className="col-12 col-xl-6">
                                        <div className="card h-100 border rounded-3 shadow-none bg-white hover-shadow transition-all">
                                          {/* Cabeçalho do Card da OS */}
                                          <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                                            <div className="d-flex align-items-center gap-2">
                                              <div className="d-flex align-items-center gap-1.5">
                                                <i className="bi bi-file-earmark-text-fill text-primary"></i>
                                                <strong className="text-dark fs-6 font-monospace">
                                                  OS nº {os.numero_os}/{os.ano_referencia}
                                                </strong>
                                              </div>

                                              {/* Situação no SGC */}
                                              <span className={`badge ${getSgcBadgeClass(os.situacao_sgc)} small px-2 py-1`}>
                                                {os.situacao_sgc || 'Não definida'}
                                              </span>

                                              {/* Passivo 2026 */}
                                              {os.situacao_passivo_2026 && os.situacao_passivo_2026.trim().toUpperCase() !== 'NULL' && (
                                                <span
                                                  className={`badge ${getPassivoBadgeClass(os.situacao_passivo_2026)} small px-2 py-0.5`}
                                                  title="Situação do Passivo 2026"
                                                >
                                                  <i className="bi bi-clock-history me-1"></i>
                                                  {os.situacao_passivo_2026}
                                                </span>
                                              )}
                                            </div>

                                            {/* Links e Ações de Edição da OS e Alocações */}
                                            <div className="btn-group btn-group-sm">
                                              <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 py-1 px-2"
                                                onClick={() => handleEditarOs(os)}
                                                title="Editar dados da Ordem de Serviço (SGC, Passivo, Notas de Empenho)"
                                              >
                                                <i className="bi bi-pencil-square"></i>
                                                <span>Editar OS</span>
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-primary btn-sm d-flex align-items-center gap-1 py-1 px-2"
                                                onClick={() => handleEditarAlocacoes(os)}
                                                title="Editar e gerenciar alocações de profissionais desta OS"
                                              >
                                                <i className="bi bi-people-fill"></i>
                                                <span>Editar Alocações</span>
                                              </button>
                                            </div>
                                          </div>

                                          {/* Métricas rápidas da OS */}
                                          <div className="bg-light px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted small">
                                            <div className="d-flex align-items-center gap-2">
                                              <span>
                                                <i className="bi bi-person-fill text-secondary me-1"></i>
                                                <strong>{osAlocs.length}</strong> {osAlocs.length === 1 ? 'alocação no mês' : 'alocações no mês'}
                                              </span>
                                            </div>

                                            <div className="d-flex align-items-center gap-3">
                                              <div>
                                                <span className="text-secondary small me-1">Custo no mês ({mesData.mes}):</span>
                                                <strong className="text-primary font-monospace">
                                                  {formatCurrency(custoTotalAlocacoesMes)}
                                                </strong>
                                              </div>
                                              <div className="border-start ps-2">
                                                <span className="text-secondary small me-1">Valor Total da OS:</span>
                                                <strong className="text-success font-monospace">
                                                  {formatCurrency(valorTotalGeralOS)}
                                                </strong>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Dados de Empenho e Processo de Pagamento da OS */}
                                          <div className="px-3 py-2 border-bottom bg-slate-50/60">
                                            <div className="row g-2 align-items-center" style={{ fontSize: '12px' }}>
                                              {/* Empenho planejado */}
                                              <div className="col-12 col-md-4">
                                                <div className="d-flex align-items-baseline gap-1 text-truncate" title={`Empenho planejado: ${os.ne_planejamento || 'Não informado'}`}>
                                                  <span className="text-secondary fw-semibold text-nowrap">Empenho planejado:</span>
                                                  {os.ne_planejamento && os.ne_planejamento.trim() ? (
                                                    <span className="badge bg-light text-dark border font-monospace px-2 py-1 text-truncate">
                                                      <i className="bi bi-file-earmark-ruled me-1 text-primary"></i>
                                                      {os.ne_planejamento}
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted fst-italic small">Não informado</span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Empenho no faturamento */}
                                              <div className="col-12 col-md-4">
                                                <div className="d-flex align-items-baseline gap-1 text-truncate" title={`Empenho no faturamento: ${os.ne_faturamento || 'Não informado'}`}>
                                                  <span className="text-secondary fw-semibold text-nowrap">Empenho no faturamento:</span>
                                                  {os.ne_faturamento && os.ne_faturamento.trim() ? (
                                                    <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle font-monospace px-2 py-1 text-truncate">
                                                      <i className="bi bi-receipt me-1"></i>
                                                      {os.ne_faturamento}
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted fst-italic small">Não informado</span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Processo de Pagamento */}
                                              <div className="col-12 col-md-4">
                                                <div className="d-flex align-items-baseline gap-1 text-truncate" title={`Processo de Pagamento: ${os.processo_sei_pagamento || 'Não informado'}`}>
                                                  <span className="text-secondary fw-semibold text-nowrap">Processo de Pagamento:</span>
                                                  {os.processo_sei_pagamento && os.processo_sei_pagamento.trim() ? (
                                                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle font-monospace px-2 py-1 text-truncate">
                                                      <i className="bi bi-folder2-open me-1"></i>
                                                      {os.processo_sei_pagamento}
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted fst-italic small">Não informado</span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Seção: Dados das Alocações dentro da OS */}
                                          <div className="card-body p-0">
                                            <div className="px-3 py-1.5 bg-light border-bottom d-flex align-items-center justify-content-between">
                                              <div className="d-flex align-items-center gap-1.5 text-secondary fw-semibold" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <i className="bi bi-people-fill text-primary"></i>
                                                <span>Dados das Alocações ({mesData.mes})</span>
                                              </div>
                                              <span className="badge bg-white text-secondary border" style={{ fontSize: '10px' }}>
                                                {osAlocs.length} {osAlocs.length === 1 ? 'profissional alocado' : 'profissionais alocados'}
                                              </span>
                                            </div>

                                            <div className="table-responsive" style={{ maxHeight: '280px' }}>
                                              <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '12px' }}>
                                                <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                                                  <tr>
                                                    <th className="ps-3 py-1.5 text-secondary fw-semibold">Profissional</th>
                                                    <th className="py-1.5 text-secondary fw-semibold">Perfil Contratado</th>
                                                    <th className="py-1.5 text-center text-secondary fw-semibold">Alocação</th>
                                                    <th className="pe-3 py-1.5 text-end text-secondary fw-semibold">Valor Alocado</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {osAlocs.map((aloc) => {
                                                    const perfil = mapaPerfis.get(aloc.perfil_contratado_id);
                                                    const nomePerfil = perfil ? perfil.nome_perfil : `Perfil #${aloc.perfil_contratado_id}`;
                                                    const itemContrato = perfil?.item_contratacao || '';

                                                    return (
                                                      <tr key={aloc.id}>
                                                        {/* Nome do Profissional */}
                                                        <td className="ps-3 py-2">
                                                          <div className="d-flex align-items-center gap-2">
                                                            <div
                                                              className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                                                              style={{ width: 26, height: 26, fontSize: '11px' }}
                                                            >
                                                              {aloc.nome_profissional ? aloc.nome_profissional.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <div>
                                                              <div className="fw-semibold text-dark">
                                                                {aloc.nome_profissional || 'Profissional não informado'}
                                                              </div>
                                                              {aloc.documento_referencia && (
                                                                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                                                                  Doc: {aloc.documento_referencia}
                                                                </small>
                                                             )}
                                                            </div>
                                                          </div>
                                                        </td>

                                                        {/* Perfil Contratado */}
                                                        <td className="py-2">
                                                          <div className="d-flex align-items-center gap-1.5">
                                                            <span className="badge bg-secondary-subtle text-secondary border small">
                                                              {itemContrato || 'Item'}
                                                            </span>
                                                            <span className="text-secondary fw-medium">
                                                              {nomePerfil}
                                                            </span>
                                                          </div>
                                                          <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                                                            Custo mensal base: {formatCurrency(aloc.custo_mensal_perfil || 0)}
                                                          </small>
                                                        </td>

                                                        {/* % Alocação */}
                                                        <td className="py-2 text-center">
                                                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1 font-monospace fw-semibold">
                                                            {aloc.percentual_alocacao}%
                                                          </span>
                                                        </td>

                                                        {/* Valor da Alocação */}
                                                        <td className="pe-3 py-2 text-end">
                                                          <div className="fw-bold font-monospace text-success">
                                                            {formatCurrency(aloc.custo_alocacao || 0)}
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modais Reutilizáveis de Edição de OS e Alocações */}
      <OrdemServicoModal
        isOpen={isOsModalOpen}
        onClose={() => {
          setIsOsModalOpen(false);
          setEditingOs(null);
        }}
        editingOs={editingOs}
      />

      <AlocacaoModal
        ordemServico={selectedOsForAlocacao}
        isOpen={isAlocacaoModalOpen}
        onClose={() => {
          setIsAlocacaoModalOpen(false);
          setSelectedOsForAlocacao(null);
        }}
        onSelectOs={(novaOs) => {
          setSelectedOsForAlocacao(novaOs);
        }}
      />
    </div>
  );
};
