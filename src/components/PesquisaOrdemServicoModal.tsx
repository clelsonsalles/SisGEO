import React, { useState, useMemo } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { OrdemServico, AlocacaoPerfilOs } from '../types/models';
import { formatCurrency } from '../utils/formatters';

interface PesquisaOrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  alocacao: AlocacaoPerfilOs | null;
  currentOs: OrdemServico | null;
  onConfirm: (novaOrdemServico: OrdemServico) => Promise<void> | void;
}

export const PesquisaOrdemServicoModal: React.FC<PesquisaOrdemServicoModalProps> = ({
  isOpen,
  onClose,
  alocacao,
  currentOs,
  onConfirm,
}) => {
  const { ordensServico, projetos, perfis, alocacoes, getCalculoValorTotalOS } = useSisgos();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filtroProjetoId, setFiltroProjetoId] = useState<string>('TODOS');
  const [filtroAno, setFiltroAno] = useState<string>('TODOS');
  const [filtroSituacaoSgc, setFiltroSituacaoSgc] = useState<string>('TODOS');
  const [selectedOsId, setSelectedOsId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Perfil da alocação sendo transferida
  const perfilAlocacao = perfis.find((p) => p.id === alocacao?.perfil_contratado_id);
  const projetoAtual = projetos.find((p) => p.id === currentOs?.projeto_id);

  // Lista de anos distintos para o filtro
  const anosDisponiveis = useMemo(() => {
    const anos = Array.from(new Set(ordensServico.map((os) => os.ano_referencia))).sort((a, b) => b - a);
    return anos;
  }, [ordensServico]);

  // Lista de situações SGC para o filtro
  const situacoesSgcDisponiveis = useMemo(() => {
    const sits = Array.from(new Set(ordensServico.map((os) => os.situacao_sgc))).sort();
    return sits;
  }, [ordensServico]);

  // Ordens de serviço filtradas pela busca e filtros
  const ordensFiltradas = useMemo(() => {
    const qLower = searchQuery.toLowerCase().trim();

    return ordensServico.filter((os) => {
      const proj = projetos.find((p) => p.id === os.projeto_id);

      // Busca textual
      if (qLower) {
        const numStr = String(os.numero_os);
        const anoStr = String(os.ano_referencia);
        const projNome = proj?.nome_projeto?.toLowerCase() || '';
        const projSigla = proj?.sigla_projeto?.toLowerCase() || '';
        const secSigla = proj?.sigla_secretaria?.toLowerCase() || '';
        const sitSgc = os.situacao_sgc?.toLowerCase() || '';
        const passivo = os.situacao_passivo_2026?.toLowerCase() || '';
        const nePlan = os.ne_planejamento?.toLowerCase() || '';
        const neFat = os.ne_faturamento?.toLowerCase() || '';
        const sei = os.processo_sei_pagamento?.toLowerCase() || '';

        const match =
          numStr.includes(qLower) ||
          anoStr.includes(qLower) ||
          projNome.includes(qLower) ||
          projSigla.includes(qLower) ||
          secSigla.includes(qLower) ||
          sitSgc.includes(qLower) ||
          passivo.includes(qLower) ||
          nePlan.includes(qLower) ||
          neFat.includes(qLower) ||
          sei.includes(qLower);

        if (!match) return false;
      }

      // Filtro de Projeto
      if (filtroProjetoId !== 'TODOS' && os.projeto_id !== Number(filtroProjetoId)) {
        return false;
      }

      // Filtro de Ano
      if (filtroAno !== 'TODOS' && os.ano_referencia !== Number(filtroAno)) {
        return false;
      }

      // Filtro de Situação SGC
      if (filtroSituacaoSgc !== 'TODOS' && os.situacao_sgc !== filtroSituacaoSgc) {
        return false;
      }

      return true;
    });
  }, [ordensServico, projetos, searchQuery, filtroProjetoId, filtroAno, filtroSituacaoSgc]);

  const selectedOs = useMemo(() => {
    return ordensServico.find((os) => os.id === selectedOsId) || null;
  }, [ordensServico, selectedOsId]);

  const selectedOsProjeto = useMemo(() => {
    return selectedOs ? projetos.find((p) => p.id === selectedOs.projeto_id) : null;
  }, [selectedOs, projetos]);

  // Checa se a OS selecionada possui conflito de unicidade para este profissional no mesmo mês
  const hasConflictWithSelected = useMemo(() => {
    if (!selectedOsId || !alocacao) return false;
    return alocacoes.some(
      (a) =>
        a.id !== alocacao.id &&
        a.ordem_servico_id === selectedOsId &&
        a.nome_profissional.trim().toLowerCase() === alocacao.nome_profissional.trim().toLowerCase() &&
        a.mes_referencia === alocacao.mes_referencia
    );
  }, [selectedOsId, alocacao, alocacoes]);

  if (!isOpen) return null;

  const handleSelectRow = (os: OrdemServico) => {
    if (os.id === currentOs?.id) return; // Não seleciona a OS atual
    setSelectedOsId(os.id);
    setErrorMsg('');
  };

  const handleConfirmAction = async () => {
    if (!selectedOs) {
      setErrorMsg('Por favor, selecione uma Ordem de Serviço de destino.');
      return;
    }

    if (selectedOs.id === currentOs?.id) {
      setErrorMsg('A Ordem de Serviço selecionada é a mesma em que a alocação já se encontra.');
      return;
    }

    if (hasConflictWithSelected) {
      setErrorMsg(
        `Não é possível transferir: O profissional "${alocacao?.nome_profissional}" já possui alocação no mês de ${alocacao?.mes_referencia} na OS #${selectedOs.numero_os}/${selectedOs.ano_referencia}.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirm(selectedOs);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao alterar Ordem de Serviço da alocação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.82)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: 44, height: 44 }}
              >
                <i className="bi bi-arrow-left-right fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">
                  Alterar Ordem de Serviço da Alocação
                </h5>
                <small className="opacity-90">
                  Pesquise e selecione a nova Ordem de Serviço para reassociar a alocação
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Fechar"
            ></button>
          </div>

          {/* Allocation Info Context Strip */}
          {alocacao && (
            <div className="bg-light border-bottom px-4 py-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-4 border-end">
                  <span className="text-muted small d-block">Profissional & Perfil</span>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-person-fill text-primary"></i>
                    <strong className="text-dark">{alocacao.nome_profissional}</strong>
                  </div>
                  <small className="text-muted">
                    {perfilAlocacao ? `${perfilAlocacao.item_contratacao} - ${perfilAlocacao.nome_perfil}` : 'Perfil'} (Mês: {alocacao.mes_referencia})
                  </small>
                </div>
                <div className="col-md-4 border-end">
                  <span className="text-muted small d-block">OS de Origem (Atual)</span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary">
                      OS #{currentOs?.numero_os} / {currentOs?.ano_referencia}
                    </span>
                    <span className="text-truncate fw-medium text-dark small">
                      {projetoAtual?.sigla_projeto} - {projetoAtual?.nome_projeto}
                    </span>
                  </div>
                  <small className="text-muted">Secretaria: {projetoAtual?.sigla_secretaria}</small>
                </div>
                <div className="col-md-4">
                  <span className="text-muted small d-block">Percentual / Custo Alocação</span>
                  <strong className="text-primary">{alocacao.percentual_alocacao}%</strong>
                  <span className="mx-2 text-muted">•</span>
                  <strong className="text-success">{formatCurrency(alocacao.custo_alocacao)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="modal-body p-4">
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Search and Filters Bar */}
            <div className="card bg-light border mb-3">
              <div className="card-body p-3">
                <div className="row g-2 align-items-end">
                  {/* Text search */}
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Pesquisar Ordens de Serviço
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white text-muted">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por número da OS, ano, projeto, NE, SEI..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setSearchQuery('')}
                          title="Limpar pesquisa"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter by Projeto */}
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Filtrar por Projeto
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroProjetoId}
                      onChange={(e) => setFiltroProjetoId(e.target.value)}
                    >
                      <option value="TODOS">Todos os Projetos</option>
                      {projetos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sigla_projeto} - {p.nome_projeto}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Ano */}
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Exercício / Ano
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroAno}
                      onChange={(e) => setFiltroAno(e.target.value)}
                    >
                      <option value="TODOS">Todos os Anos</option>
                      {anosDisponiveis.map((ano) => (
                        <option key={ano} value={ano}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Situação SGC */}
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">
                      Situação SGC
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroSituacaoSgc}
                      onChange={(e) => setFiltroSituacaoSgc(e.target.value)}
                    >
                      <option value="TODOS">Todas as Situações</option>
                      {situacoesSgcDisponiveis.map((sit) => (
                        <option key={sit} value={sit}>
                          {sit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Header / Counter */}
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="small text-muted">
                Exibindo <strong>{ordensFiltradas.length}</strong> de <strong>{ordensServico.length}</strong> Ordens de Serviço cadastradas
              </span>
              <span className="small text-primary">
                <i className="bi bi-cursor-fill me-1"></i>Clique na linha para selecionar a OS de destino
              </span>
            </div>

            {/* Table of OSs */}
            <div className="table-responsive border rounded" style={{ maxHeight: '350px' }}>
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light sticky-top shadow-sm">
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">#</th>
                    <th style={{ width: '130px' }}>Número / Ano</th>
                    <th>Projeto & Secretaria</th>
                    <th style={{ width: '130px' }}>Situação SGC</th>
                    <th style={{ width: '130px' }}>Passivo 2026</th>
                    <th style={{ width: '90px' }} className="text-center">Alocações</th>
                    <th style={{ width: '130px' }} className="text-end">Valor Total</th>
                    <th style={{ width: '110px' }} className="text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {ordensFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <i className="bi bi-search fs-3 d-block mb-2 text-secondary"></i>
                        Nenhuma Ordem de Serviço encontrada com os critérios de busca informados.
                      </td>
                    </tr>
                  ) : (
                    ordensFiltradas.map((os) => {
                      const proj = projetos.find((p) => p.id === os.projeto_id);
                      const isCurrent = os.id === currentOs?.id;
                      const isSelected = os.id === selectedOsId;
                      const qtdAloc = alocacoes.filter((a) => a.ordem_servico_id === os.id).length;
                      const valorTotal = getCalculoValorTotalOS(os.id);

                      // Verifica conflito de unicidade nesta OS
                      const hasConflict =
                        alocacao &&
                        !isCurrent &&
                        alocacoes.some(
                          (a) =>
                            a.id !== alocacao.id &&
                            a.ordem_servico_id === os.id &&
                            a.nome_profissional.trim().toLowerCase() === alocacao.nome_profissional.trim().toLowerCase() &&
                            a.mes_referencia === alocacao.mes_referencia
                        );

                      let rowClass = '';
                      if (isSelected) {
                        rowClass = 'table-primary border-primary';
                      } else if (isCurrent) {
                        rowClass = 'bg-light opacity-75';
                      }

                      return (
                        <tr
                          key={os.id}
                          className={rowClass}
                          style={{ cursor: isCurrent ? 'not-allowed' : 'pointer' }}
                          onClick={() => !isCurrent && handleSelectRow(os)}
                        >
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="radio"
                              name="selectedOsRadio"
                              className="form-check-input"
                              checked={isSelected}
                              disabled={isCurrent}
                              onChange={() => handleSelectRow(os)}
                            />
                          </td>

                          {/* Número OS / Exercício */}
                          <td>
                            <strong className="text-dark">OS #{os.numero_os}</strong>
                            <span className="text-muted small d-block">Exercício {os.ano_referencia}</span>
                          </td>

                          {/* Projeto & Secretaria */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-primary">{proj?.sigla_projeto}</strong>
                              <span className="badge bg-secondary-subtle text-secondary border">
                                {proj?.sigla_secretaria}
                              </span>
                            </div>
                            <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>
                              {proj?.nome_projeto}
                            </small>
                          </td>

                          {/* Situação SGC */}
                          <td>
                            <span className="badge bg-secondary text-white small">
                              {os.situacao_sgc}
                            </span>
                          </td>

                          {/* Passivo 2026 */}
                          <td>
                            {os.situacao_passivo_2026 && os.situacao_passivo_2026.trim().toUpperCase() !== 'NULL' ? (
                              <span className="badge bg-light text-dark border small">
                                {os.situacao_passivo_2026}
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary border font-monospace small">
                                NULL
                              </span>
                            )}
                          </td>

                          {/* Alocações */}
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {qtdAloc}
                            </span>
                          </td>

                          {/* Valor Total */}
                          <td className="text-end font-monospace fw-semibold text-dark">
                            {formatCurrency(valorTotal)}
                          </td>

                          {/* Status / Ação */}
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            {isCurrent ? (
                              <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                                <i className="bi bi-geo-alt-fill me-1"></i>OS Atual
                              </span>
                            ) : hasConflict ? (
                              <span
                                className="badge bg-danger-subtle text-danger border border-danger-subtle"
                                title={`O profissional "${alocacao?.nome_profissional}" já possui alocação nesta OS no mês de ${alocacao?.mes_referencia}`}
                              >
                                <i className="bi bi-exclamation-octagon me-1"></i>Conflito Mês
                              </span>
                            ) : isSelected ? (
                              <span className="badge bg-success text-white">
                                <i className="bi bi-check-lg me-1"></i>Selecionada
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary py-1 px-2"
                                style={{ fontSize: '11px' }}
                                onClick={() => handleSelectRow(os)}
                              >
                                Selecionar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected OS Confirmation Preview Bar */}
            {selectedOs && (
              <div className="card border-success mt-3 bg-success-subtle shadow-sm">
                <div className="card-body py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32 }}
                    >
                      <i className="bi bi-check2"></i>
                    </div>
                    <div>
                      <span className="text-success-emphasis fw-bold d-block small">
                        Ordem de Serviço Selecionada para Transferência:
                      </span>
                      <strong className="text-dark">
                        OS #{selectedOs.numero_os} / {selectedOs.ano_referencia}
                      </strong>
                      <span className="mx-2 text-muted">•</span>
                      <span className="text-dark">
                        {selectedOsProjeto?.sigla_projeto} - {selectedOsProjeto?.nome_projeto}
                      </span>
                      <span className="badge bg-white text-dark border ms-2">
                        {selectedOsProjeto?.sigla_secretaria}
                      </span>
                    </div>
                  </div>

                  {hasConflictWithSelected ? (
                    <div className="text-danger fw-medium small">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      Atenção: Já existe alocação para este profissional no mês de {alocacao?.mes_referencia} nesta OS.
                    </div>
                  ) : (
                    <span className="badge bg-success text-white px-3 py-2">
                      <i className="bi bi-shield-check me-1"></i>Pronta para associação
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <div className="d-flex align-items-center gap-2">
              {selectedOs && !hasConflictWithSelected && (
                <span className="small text-muted me-2">
                  Transferir de OS #{currentOs?.numero_os} para <strong>OS #{selectedOs.numero_os}</strong>
                </span>
              )}
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold shadow-sm"
                onClick={handleConfirmAction}
                disabled={!selectedOs || selectedOs.id === currentOs?.id || hasConflictWithSelected || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Transferindo...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i>
                    Confirmar Alteração de OS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
