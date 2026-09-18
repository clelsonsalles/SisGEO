import React, { useState, useMemo } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { OrdemServico, MESES_REFERENCIA } from '../types/models';
import { formatCurrency } from '../utils/formatters';
import { AlocacaoModal } from './AlocacaoModal';
import { OrdemServicoModal } from './OrdemServicoModal';
import { ActiveTab } from './Navbar';

interface GestaoOSProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const GestaoOS: React.FC<GestaoOSProps> = ({ onNavigate }) => {
  const {
    ordensServico,
    projetos,
    alocacoes,
    deleteOrdemServico,
    getCalculoValorTotalOS,
    getSituacoesSgcDoBanco,
    getSituacoesPassivoDoBanco,
  } = useSisgos();

  // State for modals
  const [selectedOsForAlocacao, setSelectedOsForAlocacao] = useState<OrdemServico | null>(null);
  const [isAlocacaoModalOpen, setIsAlocacaoModalOpen] = useState<boolean>(false);

  const [isOsModalOpen, setIsOsModalOpen] = useState<boolean>(false);
  const [editingOs, setEditingOs] = useState<OrdemServico | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filtroProjeto, setFiltroProjeto] = useState<string>('TODOS');
  const [filtroAno, setFiltroAno] = useState<string>('TODOS');
  const [filtroMes, setFiltroMes] = useState<string>('TODOS');
  const [filtroSituacaoSgc, setFiltroSituacaoSgc] = useState<string>('TODOS');
  const [filtroSituacaoPassivo, setFiltroSituacaoPassivo] = useState<string>('TODOS');

  // Dynamic situations available from database
  const situacoesSgcDisponiveis = useMemo(() => {
    return getSituacoesSgcDoBanco();
  }, [getSituacoesSgcDoBanco]);

  const situacoesPassivoDisponiveis = useMemo(() => {
    return getSituacoesPassivoDoBanco();
  }, [getSituacoesPassivoDoBanco]);

  // Calculation of summary metrics
  const anosDisponiveis = useMemo(() => {
    const anos = Array.from(new Set(ordensServico.map((os) => os.ano_referencia))).sort(
      (a, b) => b - a
    );
    return anos;
  }, [ordensServico]);

  const filteredOrdens = useMemo(() => {
    return ordensServico.filter((os) => {
      const projeto = projetos.find((p) => p.id === os.projeto_id);
      const osAlocs = alocacoes.filter((a) => a.ordem_servico_id === os.id);
      const mesesAloc = osAlocs.map((a) => a.mes_referencia.toLowerCase());

      // Search match
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        searchQuery.trim() === '' ||
        String(os.numero_os).includes(searchQuery) ||
        mesesAloc.some((m) => m.includes(searchLower)) ||
        os.situacao_sgc.toLowerCase().includes(searchLower) ||
        os.situacao_passivo_2026.toLowerCase().includes(searchLower) ||
        (os.ne_planejamento && os.ne_planejamento.toLowerCase().includes(searchLower)) ||
        (os.ne_faturamento && os.ne_faturamento.toLowerCase().includes(searchLower)) ||
        (os.processo_sei_pagamento && os.processo_sei_pagamento.toLowerCase().includes(searchLower)) ||
        projeto?.nome_projeto.toLowerCase().includes(searchLower) ||
        projeto?.sigla_projeto.toLowerCase().includes(searchLower) ||
        projeto?.sigla_secretaria.toLowerCase().includes(searchLower);

      // Filter project
      const projetoMatch =
        filtroProjeto === 'TODOS' || String(os.projeto_id) === filtroProjeto;

      // Filter ano
      const anoMatch =
        filtroAno === 'TODOS' || String(os.ano_referencia) === filtroAno;

      // Filter mes (via alocações da OS)
      const mesMatch =
        filtroMes === 'TODOS' ||
        osAlocs.some((a) => a.mes_referencia === filtroMes);

      // Filter situação SGC
      const sgcMatch =
        filtroSituacaoSgc === 'TODOS' || os.situacao_sgc === filtroSituacaoSgc;

      // Filter situação Passivo 2026
      const passivoMatch =
        filtroSituacaoPassivo === 'TODOS' || os.situacao_passivo_2026 === filtroSituacaoPassivo;

      return searchMatch && projetoMatch && anoMatch && mesMatch && sgcMatch && passivoMatch;
    });
  }, [ordensServico, alocacoes, projetos, searchQuery, filtroProjeto, filtroAno, filtroMes, filtroSituacaoSgc, filtroSituacaoPassivo]);

  // Overall calculations
  const totalGeralCalculado = useMemo(() => {
    return filteredOrdens.reduce(
      (acc, os) => acc + getCalculoValorTotalOS(os.id),
      0
    );
  }, [filteredOrdens, getCalculoValorTotalOS, alocacoes]);

  const totalProfissionaisAlocadosGeral = useMemo(() => {
    const osIds = new Set(filteredOrdens.map((os) => os.id));
    return alocacoes.filter((a) => osIds.has(a.ordem_servico_id)).length;
  }, [filteredOrdens, alocacoes]);

  // Actions
  const handleOpenAlocacao = (os: OrdemServico) => {
    setSelectedOsForAlocacao(os);
    setIsAlocacaoModalOpen(true);
  };

  const handleCreateOs = () => {
    setEditingOs(null);
    setIsOsModalOpen(true);
  };

  const handleEditOs = (os: OrdemServico) => {
    setEditingOs(os);
    setIsOsModalOpen(true);
  };

  const handleDeleteOs = (os: OrdemServico) => {
    const totalAlocacoes = alocacoes.filter((a) => a.ordem_servico_id === os.id).length;
    let msg = `Tem certeza que deseja excluir a Ordem de Serviço #${os.numero_os}/${os.ano_referencia}?`;
    if (totalAlocacoes > 0) {
      msg += `\nATENÇÃO: Existem ${totalAlocacoes} alocação(ões) vinculada(s) a esta OS que também serão excluídas.`;
    }
    if (window.confirm(msg)) {
      deleteOrdemServico(os.id);
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-bold">
              Módulo Operacional
            </span>
            <span className="text-muted small">
              Tabela: <code>ordens_servico</code> & <code>alocacoes_perfil_os</code>
            </span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Gestão de Ordens de Serviço (OSs)</h2>
          <p className="text-muted mb-0 small">
            Gerenciamento do ciclo de vida das OSs, associação a projetos e alocação de equipes com cálculo em tempo real.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
          onClick={handleCreateOs}
        >
          <i className="bi bi-plus-circle-fill fs-6"></i>
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      {/* Visual Navigation Banner for Menu Groups */}
      {onNavigate && (
        <div className="card border-0 shadow-sm mb-4 bg-white border-start border-4 border-warning">
          <div className="card-body p-3">
            <div className="d-flex flex-column flex-xl-row align-items-xl-center justify-content-between gap-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-dark text-white px-2 py-1">
                    <i className="bi bi-grid-fill me-1 text-warning"></i>
                    Menu do SisGOS
                  </span>
                  <span className="fw-bold text-dark">
                    Acesso Rápido aos Grupos de Menus:
                  </span>
                </div>
                <small className="text-muted d-block mt-1">
                  Alterne facilmente entre as tabelas de apoio (Parâmetros) e os recursos de engenharia (Administração):
                </small>
              </div>

              <div className="d-flex flex-wrap gap-2 align-items-center">
                {/* 0. Dashboard Analítico */}
                <button
                  type="button"
                  className="btn btn-sm btn-success fw-bold text-white d-flex align-items-center gap-1 py-1 px-3 shadow-sm"
                  onClick={() => onNavigate('dashboard-analitico')}
                  title="Abrir Dashboard Analítico com gráficos Chart.js"
                >
                  <i className="bi bi-bar-chart-line-fill"></i>
                  <span>Dashboard Analítico</span>
                </button>

                {/* 1. Grupo Parâmetros */}
                <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-3 border">
                  <span className="badge bg-warning text-dark me-1">
                    <i className="bi bi-sliders me-1"></i>
                    Parâmetros:
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark fw-semibold d-flex align-items-center gap-1 py-1 px-2"
                    onClick={() => onNavigate('param-perfis')}
                  >
                    <i className="bi bi-person-badge text-primary"></i>
                    <span>Perfis Contratados</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark fw-semibold d-flex align-items-center gap-1 py-1 px-2"
                    onClick={() => onNavigate('param-projetos')}
                  >
                    <i className="bi bi-folder2 text-warning"></i>
                    <span>Projetos</span>
                  </button>
                </div>

                {/* 2. Grupo Administração */}
                <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-3 border">
                  <span className="badge bg-dark text-info me-1">
                    <i className="bi bi-shield-lock-fill me-1"></i>
                    Administração:
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark fw-semibold d-flex align-items-center gap-1 py-1 px-2"
                    onClick={() => onNavigate('admin-der')}
                  >
                    <i className="bi bi-diagram-3-fill text-info"></i>
                    <span>Modelo DER</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark fw-semibold d-flex align-items-center gap-1 py-1 px-2"
                    onClick={() => onNavigate('admin-ddl')}
                  >
                    <i className="bi bi-code-slash text-warning"></i>
                    <span>DDL SQL</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark fw-semibold d-flex align-items-center gap-1 py-1 px-2"
                    onClick={() => onNavigate('admin-simulador')}
                  >
                    <i className="bi bi-cpu-fill text-danger"></i>
                    <span>Simulador</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-warning text-dark fw-bold d-flex align-items-center gap-1 py-1 px-2 shadow-sm"
                    onClick={() => onNavigate('admin-springboot')}
                  >
                    <i className="bi bi-cup-hot-fill text-dark"></i>
                    <span>Spring Boot (Java)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Total de OSs Listadas
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {filteredOrdens.length}
                    <span className="text-muted fs-6 fw-normal ms-2">
                      / {ordensServico.length} total
                    </span>
                  </h3>
                </div>
                <div className="bg-primary-subtle text-primary p-3 rounded-3">
                  <i className="bi bi-file-earmark-text fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Valor Total (Soma das OSs)
                  </span>
                  <h3 className="fw-bold text-success mb-0 mt-1">
                    {formatCurrency(totalGeralCalculado)}
                  </h3>
                </div>
                <div className="bg-success-subtle text-success p-3 rounded-3">
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-info border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Alocações Registradas
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {totalProfissionaisAlocadosGeral}
                  </h3>
                </div>
                <div className="bg-info-subtle text-info p-3 rounded-3">
                  <i className="bi bi-people-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">
                    Projetos com OS
                  </span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">
                    {new Set(filteredOrdens.map((os) => os.projeto_id)).size}
                  </h3>
                </div>
                <div className="bg-warning-subtle text-warning-emphasis p-3 rounded-3">
                  <i className="bi bi-diagram-3-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-xl-3">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por OS, projeto, secretaria ou situação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Projeto */}
            <div className="col-6 col-md-4 col-xl-2">
              <select
                className="form-select"
                value={filtroProjeto}
                onChange={(e) => setFiltroProjeto(e.target.value)}
              >
                <option value="TODOS">Todos os Projetos</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sigla_projeto} - {p.nome_projeto}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Situação SGC */}
            <div className="col-6 col-md-4 col-xl-2">
              <select
                className="form-select"
                value={filtroSituacaoSgc}
                onChange={(e) => setFiltroSituacaoSgc(e.target.value)}
                title="Filtrar por Situação no SGC"
              >
                <option value="TODOS">Situação SGC (Todas)</option>
                {situacoesSgcDisponiveis.map((sit) => (
                  <option key={sit} value={sit}>
                    {sit}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Situação Passivo 2026 */}
            <div className="col-6 col-md-4 col-xl-2">
              <select
                className="form-select"
                value={filtroSituacaoPassivo}
                onChange={(e) => setFiltroSituacaoPassivo(e.target.value)}
                title="Filtrar por Situação Passivo 2026"
              >
                <option value="TODOS">Passivo 2026 (Todos)</option>
                {situacoesPassivoDisponiveis.map((pass) => (
                  <option key={pass} value={pass}>
                    {pass}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Ano */}
            <div className="col-3 col-md-2 col-xl-1">
              <select
                className="form-select px-1 text-center"
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
              >
                <option value="TODOS">Ano</option>
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mês */}
            <div className="col-3 col-md-2 col-xl-1">
              <select
                className="form-select px-1 text-center"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
              >
                <option value="TODOS">Mês</option>
                {MESES_REFERENCIA.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            <div className="col-12 col-md-2 col-xl-1 text-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                title="Limpar todos os filtros"
                onClick={() => {
                  setSearchQuery('');
                  setFiltroProjeto('TODOS');
                  setFiltroAno('TODOS');
                  setFiltroMes('TODOS');
                  setFiltroSituacaoSgc('TODOS');
                  setFiltroSituacaoPassivo('TODOS');
                }}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark">
            <i className="bi bi-table me-2 text-primary"></i>
            Ordens de Serviço Cadastradas ({filteredOrdens.length})
          </span>
          <span className="badge bg-light text-secondary border">
            Ordenação por Número e Referência
          </span>
        </div>

        {filteredOrdens.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="bi bi-inbox text-muted fs-1 d-block mb-2"></i>
            <h5 className="text-secondary fw-semibold">Nenhuma Ordem de Serviço encontrada</h5>
            <p className="text-muted small mb-3">
              Tente alterar os termos da busca ou cadastre uma nova Ordem de Serviço.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCreateOs}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Criar Nova Ordem de Serviço
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '130px' }}>OS / Referência</th>
                  <th style={{ width: '22%' }}>Projeto Vinculado</th>
                  <th style={{ width: '180px' }}>Empenho & Pagamento</th>
                  <th style={{ width: '130px' }}>Indicadores SGC</th>
                  <th>Situação SGC</th>
                  <th>Passivo 2026</th>
                  <th className="text-center" style={{ width: '100px' }}>Alocações</th>
                  <th className="text-end" style={{ width: '150px' }}>
                    Valor Total da OS
                  </th>
                  <th className="text-center" style={{ width: '150px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdens.map((os) => {
                  const projeto = projetos.find((p) => p.id === os.projeto_id);
                  const osAlocacoes = alocacoes.filter((a) => a.ordem_servico_id === os.id);
                  const valorTotalCalculado = getCalculoValorTotalOS(os.id);
                  const mesesAlocados = Array.from(new Set(osAlocacoes.map((a) => a.mes_referencia)));

                  return (
                    <tr key={os.id}>
                      {/* OS / Referência */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-dark px-2 py-1 fs-7">
                            OS #{os.numero_os}
                          </span>
                        </div>
                        <div className="text-muted small mt-1">
                          Ano: <strong className="text-dark">{os.ano_referencia}</strong>
                        </div>
                        {mesesAlocados.length > 0 && (
                          <div className="mt-1">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>
                              {mesesAlocados.join(', ')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Projeto */}
                      <td>
                        <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: 300 }}>
                          {projeto?.nome_projeto || `Projeto ID ${os.projeto_id}`}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                            {projeto?.sigla_projeto}
                          </span>
                          <span className="badge bg-light text-muted border">
                            {projeto?.sigla_secretaria}
                          </span>
                        </div>
                      </td>

                      {/* Empenho & Pagamento (NEs e SEI da OS) */}
                      <td>
                        <div className="d-flex flex-column gap-1 small">
                          {os.ne_planejamento ? (
                            <div className="text-truncate" title={`NE Planejamento: ${os.ne_planejamento}`}>
                              <span className="text-muted" style={{ fontSize: '10px' }}>NE Plan: </span>
                              <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '11px' }}>
                                <i className="bi bi-file-earmark-ruled me-1 text-primary"></i>
                                {os.ne_planejamento}
                              </span>
                            </div>
                          ) : null}
                          {os.ne_faturamento ? (
                            <div className="text-truncate" title={`NE Faturamento: ${os.ne_faturamento}`}>
                              <span className="text-muted" style={{ fontSize: '10px' }}>NE Fat: </span>
                              <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle font-monospace" style={{ fontSize: '11px' }}>
                                <i className="bi bi-receipt me-1"></i>
                                {os.ne_faturamento}
                              </span>
                            </div>
                          ) : null}
                          {os.processo_sei_pagamento ? (
                            <div className="text-truncate" title={`Processo SEI Pagamento: ${os.processo_sei_pagamento}`}>
                              <span className="text-muted" style={{ fontSize: '10px' }}>SEI: </span>
                              <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle font-monospace" style={{ fontSize: '11px' }}>
                                <i className="bi bi-folder2-open me-1"></i>
                                {os.processo_sei_pagamento}
                              </span>
                            </div>
                          ) : null}
                          {!os.ne_planejamento && !os.ne_faturamento && !os.processo_sei_pagamento && (
                            <span className="text-muted small">—</span>
                          )}
                        </div>
                      </td>

                      {/* Indicadores SGC */}
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span
                            className={`badge ${
                              os.alocacao_sgc
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-light text-muted border'
                            }`}
                            style={{ fontSize: '11px' }}
                          >
                            <i className={`bi ${os.alocacao_sgc ? 'bi-check2' : 'bi-dash'} me-1`}></i>
                            Alocação: {os.alocacao_sgc ? 'Sim' : 'Não'}
                          </span>
                          <span
                            className={`badge ${
                              os.entrega_sgc
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-light text-muted border'
                            }`}
                            style={{ fontSize: '11px' }}
                          >
                            <i className={`bi ${os.entrega_sgc ? 'bi-check2' : 'bi-dash'} me-1`}></i>
                            Entrega: {os.entrega_sgc ? 'Sim' : 'Não'}
                          </span>
                          <span
                            className={`badge ${
                              os.descricao_sgc
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-light text-muted border'
                            }`}
                            style={{ fontSize: '11px' }}
                          >
                            <i className={`bi ${os.descricao_sgc ? 'bi-check2' : 'bi-dash'} me-1`}></i>
                            Descrição: {os.descricao_sgc ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </td>

                      {/* Situação SGC */}
                      <td>
                        <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1">
                          {os.situacao_sgc}
                        </span>
                      </td>

                      {/* Passivo 2026 */}
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {os.situacao_passivo_2026}
                        </span>
                      </td>

                      {/* Alocações */}
                      <td className="text-center">
                        <button
                          type="button"
                          className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                            osAlocacoes.length > 0
                              ? 'btn-outline-primary'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => handleOpenAlocacao(os)}
                          title="Clique para gerenciar as alocações de perfis na OS"
                        >
                          <i className="bi bi-people-fill"></i>
                          <span>{osAlocacoes.length}</span>
                        </button>
                      </td>

                      {/* Valor Total da OS (Calculado) */}
                      <td className="text-end">
                        <div className="fw-bold text-success font-monospace fs-6">
                          {formatCurrency(valorTotalCalculado)}
                        </div>
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          {osAlocacoes.length} {osAlocacoes.length === 1 ? 'linha' : 'linhas'} somada(s)
                        </small>
                      </td>

                      {/* Ações */}
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          {/* Botão de Alocação de Perfis na OS (Popup) */}
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleOpenAlocacao(os)}
                            title="Alocar Perfis nesta OS (Popup N:N)"
                          >
                            <i className="bi bi-person-plus-fill me-1"></i>
                            Alocar
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleEditOs(os)}
                            title="Editar Ordem de Serviço"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteOs(os)}
                            title="Excluir Ordem de Serviço"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popup / Modal de Alocação de Perfis */}
      <AlocacaoModal
        ordemServico={selectedOsForAlocacao}
        isOpen={isAlocacaoModalOpen}
        onClose={() => {
          setIsAlocacaoModalOpen(false);
          setSelectedOsForAlocacao(null);
        }}
      />

      {/* Modal de Criação / Edição de Ordem de Serviço */}
      <OrdemServicoModal
        isOpen={isOsModalOpen}
        onClose={() => {
          setIsOsModalOpen(false);
          setEditingOs(null);
        }}
        editingOs={editingOs}
      />
    </div>
  );
};
