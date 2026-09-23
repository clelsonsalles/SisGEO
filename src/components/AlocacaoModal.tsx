import React, { useState, useEffect } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { OrdemServico, AlocacaoPerfilOs, MESES_REFERENCIA, MesReferencia } from '../types/models';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { PesquisaOrdemServicoModal } from './PesquisaOrdemServicoModal';

interface AlocacaoModalProps {
  ordemServico: OrdemServico | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectOs?: (os: OrdemServico) => void;
}

export const AlocacaoModal: React.FC<AlocacaoModalProps> = ({
  ordemServico,
  isOpen,
  onClose,
  onSelectOs,
}) => {
  const {
    projetos,
    perfis,
    alocacoes,
    addAlocacao,
    updateAlocacao,
    alterarOrdemServicoAlocacao,
    deleteAlocacao,
    getCalculoValorTotalOS,
    getNomesProfissionaisDistintos,
  } = useSisgos();

  // Mode: list or form
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal para pesquisar e alterar OS
  const [isAlterarOsModalOpen, setIsAlterarOsModalOpen] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [transferredOsInfo, setTransferredOsInfo] = useState<OrdemServico | null>(null);

  // Form fields
  const [selectedPerfilId, setSelectedPerfilId] = useState<number | ''>('');
  const [mesReferencia, setMesReferencia] = useState<MesReferencia>('JANEIRO');
  const [nomeProfissional, setNomeProfissional] = useState<string>('');
  const [percentualAlocacao, setPercentualAlocacao] = useState<number>(100);
  const [formError, setFormError] = useState<string>('');

  // Nomes distintos para autocomplete
  const nomesDistintos = getNomesProfissionaisDistintos();

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setSelectedPerfilId(perfis.length > 0 ? perfis[0].id : '');
    setMesReferencia('JANEIRO');
    setNomeProfissional('');
    setPercentualAlocacao(100);
    setFormError('');
  };

  if (!isOpen || !ordemServico) return null;

  const projeto = projetos.find((p) => p.id === ordemServico.projeto_id);
  const osAlocacoes = alocacoes.filter(
    (a) => a.ordem_servico_id === ordemServico.id
  );
  const valorTotalOS = getCalculoValorTotalOS(ordemServico.id);

  // Selected profile details for rule simulation
  const selectedPerfil = perfis.find((p) => p.id === Number(selectedPerfilId));
  const simulatedCustoMensal = selectedPerfil?.custo_mensal_perfil || 0;
  const simulatedDocRef = selectedPerfil?.documento_referencia || '—';
  const simulatedCustoAlocacao =
    (percentualAlocacao * simulatedCustoMensal) / 100;

  const handleStartAdd = () => {
    resetForm();
    if (perfis.length > 0) {
      setSelectedPerfilId(perfis[0].id);
    }
    setIsEditing(true);
  };

  const handleStartEdit = (item: AlocacaoPerfilOs) => {
    setEditingId(item.id);
    setSelectedPerfilId(item.perfil_contratado_id);
    setMesReferencia(item.mes_referencia);
    setNomeProfissional(item.nome_profissional);
    setPercentualAlocacao(item.percentual_alocacao);
    setFormError('');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerfilId) {
      setFormError('Por favor, selecione um perfil contratado.');
      return;
    }
    if (!nomeProfissional.trim()) {
      setFormError('Informe o nome do profissional.');
      return;
    }
    if (!mesReferencia) {
      setFormError('Selecione o mês de referência.');
      return;
    }
    if (percentualAlocacao <= 0 || percentualAlocacao > 100) {
      setFormError('O percentual de alocação deve estar entre 0,01% e 100,00%.');
      return;
    }

    try {
      if (editingId) {
        updateAlocacao(editingId, {
          perfil_contratado_id: Number(selectedPerfilId),
          mes_referencia: mesReferencia,
          nome_profissional: nomeProfissional.trim(),
          percentual_alocacao: percentualAlocacao,
        });
      } else {
        addAlocacao({
          ordem_servico_id: ordemServico.id,
          perfil_contratado_id: Number(selectedPerfilId),
          mes_referencia: mesReferencia,
          nome_profissional: nomeProfissional.trim(),
          percentual_alocacao: percentualAlocacao,
        });
      }
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar alocação.');
    }
  };

  const handleConfirmAlterarOs = async (novaOs: OrdemServico) => {
    if (!editingId) return;
    const alocAtual = alocacoes.find((a) => a.id === editingId);
    const nomeProf = alocAtual?.nome_profissional || nomeProfissional;

    await alterarOrdemServicoAlocacao(editingId, novaOs.id);

    const projDestino = projetos.find((p) => p.id === novaOs.projeto_id);
    const msg = `Alocação do profissional "${nomeProf}" foi alterada e associada com sucesso à OS #${novaOs.numero_os}/${novaOs.ano_referencia} (${projDestino?.sigla_projeto || 'Projeto'})!`;
    setSuccessNotice(msg);
    setTransferredOsInfo(novaOs);
    resetForm();
  };

  const handleDelete = (id: number, nome: string) => {
    if (
      window.confirm(
        `Confirma a remoção da alocação de "${nome}" desta Ordem de Serviço?`
      )
    ) {
      deleteAlocacao(id);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header bg-primary text-white py-3 px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 44, height: 44 }}
              >
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">
                  Alocação de Perfis na Ordem de Serviço
                </h5>
                <small className="opacity-90">
                  Gestão da Tabela Associativa: <code>alocacoes_perfil_os</code> (Relação N:N com Mês de Referência)
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Fechar"
            ></button>
          </div>

          {/* Context bar / OS details */}
          <div className="bg-light border-bottom px-4 py-3">
            <div className="row g-3 align-items-center">
              <div className="col-md-3">
                <span className="text-muted small d-block">Número da OS / Exercício</span>
                <span className="fw-bold fs-6 text-dark">
                  OS #{ordemServico.numero_os} / {ordemServico.ano_referencia}
                </span>
              </div>
              <div className="col-md-3">
                <span className="text-muted small d-block">Situação SGC</span>
                <span className="badge bg-secondary px-2 py-1 fs-7">
                  {ordemServico.situacao_sgc}
                </span>
              </div>
              <div className="col-md-3">
                <span className="text-muted small d-block">Projeto Vinculado</span>
                <span className="fw-semibold text-dark text-truncate d-block">
                  {projeto?.nome_projeto || 'Projeto não identificado'}
                </span>
                <small className="text-muted">
                  {projeto?.sigla_projeto} • {projeto?.sigla_secretaria}
                </small>
              </div>
              <div className="col-md-3 text-md-end">
                <span className="text-muted small d-block">Valor Total da OS</span>
                <span className="fs-5 fw-bold text-success">
                  {formatCurrency(valorTotalOS)}
                </span>
              </div>
            </div>
            {/* Informações de NE e Processo SEI da Ordem de Serviço */}
            {(ordemServico.ne_planejamento || ordemServico.ne_faturamento || ordemServico.processo_sei_pagamento) && (
              <div className="d-flex flex-wrap gap-3 mt-2 pt-2 border-top small align-items-center">
                {ordemServico.ne_planejamento && (
                  <div>
                    <span className="text-muted me-1">NE Planejamento:</span>
                    <span className="badge bg-light text-dark border font-monospace">
                      <i className="bi bi-file-earmark-ruled me-1 text-primary"></i>
                      {ordemServico.ne_planejamento}
                    </span>
                  </div>
                )}
                {ordemServico.ne_faturamento && (
                  <div>
                    <span className="text-muted me-1">NE Faturamento:</span>
                    <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle font-monospace">
                      <i className="bi bi-receipt me-1"></i>
                      {ordemServico.ne_faturamento}
                    </span>
                  </div>
                )}
                {ordemServico.processo_sei_pagamento && (
                  <div>
                    <span className="text-muted me-1">Processo SEI:</span>
                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle font-monospace">
                      <i className="bi bi-folder2-open me-1"></i>
                      {ordemServico.processo_sei_pagamento}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Feedback alert after transferring/associating OS */}
            {successNotice && (
              <div className="alert alert-success alert-dismissible fade show py-3 px-3 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2 shadow-sm border-success">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                  <span className="fw-semibold text-dark">{successNotice}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {transferredOsInfo && onSelectOs && (
                    <button
                      type="button"
                      className="btn btn-sm btn-success fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                      onClick={() => {
                        onSelectOs(transferredOsInfo);
                        setSuccessNotice(null);
                        setTransferredOsInfo(null);
                      }}
                    >
                      <i className="bi bi-box-arrow-in-right"></i>
                      Visualizar OS #{transferredOsInfo.numero_os}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSuccessNotice(null);
                      setTransferredOsInfo(null);
                    }}
                    aria-label="Fechar"
                  ></button>
                </div>
              </div>
            )}

            {/* Form Section when open */}
            {isEditing ? (
              <div className="card border-primary border-2 shadow-sm mb-4">
                <div className="card-header bg-primary-subtle text-primary-emphasis fw-bold py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-pencil-square text-primary fs-5"></i>
                    <span>
                      {editingId ? 'Editar Alocação de Perfil' : 'Nova Alocação de Perfil na OS'}
                    </span>
                    {editingId && (
                      <span className="badge bg-primary text-white ms-1">
                        OS #{ordemServico.numero_os} / {ordemServico.ano_referencia}
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                        onClick={() => setIsAlterarOsModalOpen(true)}
                        title="Pesquisar e transferir esta alocação para outra Ordem de Serviço"
                      >
                        <i className="bi bi-arrow-left-right"></i>
                        <span>Alterar OS</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => resetForm()}
                    >
                      <i className="bi bi-x me-1"></i>Cancelar
                    </button>
                  </div>
                </div>
                <div className="card-body p-4">
                  {/* Top Bar inside form with Current OS Association & Alterar OS button */}
                  {editingId && (
                    <div className="bg-light border border-primary-subtle rounded-3 p-3 mb-4 shadow-sm d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: 38, height: 38 }}
                        >
                          <i className="bi bi-file-earmark-text-fill fs-5"></i>
                        </div>
                        <div>
                          <span className="text-muted small d-block">
                            Ordem de Serviço Associada a esta Alocação:
                          </span>
                          <strong className="text-dark fs-6">
                            OS #{ordemServico.numero_os} / {ordemServico.ano_referencia}
                          </strong>
                          <span className="mx-2 text-muted">•</span>
                          <span className="fw-semibold text-primary">{projeto?.sigla_projeto}</span>
                          <span className="text-muted ms-1">({projeto?.nome_projeto})</span>
                          <span className="badge bg-secondary-subtle text-secondary border ms-2">
                            {projeto?.sigla_secretaria}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-primary fw-bold shadow-sm d-inline-flex align-items-center gap-2 px-3 py-2"
                        onClick={() => setIsAlterarOsModalOpen(true)}
                        title="Pesquisar outra Ordem de Serviço e transferir esta alocação"
                      >
                        <i className="bi bi-arrow-left-right fs-6"></i>
                        <span>Alterar OS</span>
                      </button>
                    </div>
                  )}

                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSave}>
                    <div className="row g-3">
                      {/* Perfil Contratado Select */}
                      <div className="col-md-5">
                        <label className="form-label fw-semibold">
                          Perfil Contratado <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedPerfilId}
                          onChange={(e) => setSelectedPerfilId(Number(e.target.value))}
                          required
                        >
                          <option value="">-- Selecione o Perfil Contratado --</option>
                          {perfis.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.item_contratacao} - {p.nome_perfil} ({formatCurrency(p.custo_mensal_perfil)}/mês) {!p.vigente ? ' [NÃO VIGENTE]' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="form-text small">
                          Custo mensal e documento de referência copiados automaticamente.
                        </div>
                      </div>

                      {/* Mês de Referência da Alocação */}
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Mês de Referência <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={mesReferencia}
                          onChange={(e) => setMesReferencia(e.target.value as MesReferencia)}
                          required
                        >
                          {MESES_REFERENCIA.map((mes) => (
                            <option key={mes} value={mes}>
                              {mes}
                            </option>
                          ))}
                        </select>
                        <div className="form-text small">
                          Restrição UNIQUE (OS + Profissional + Mês)
                        </div>
                      </div>

                      {/* Nome do Profissional com Autocomplete e inserção livre */}
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">
                          Nome do Profissional <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-person"></i>
                          </span>
                          <input
                            type="text"
                            list="profissionais-list"
                            className="form-control"
                            placeholder="Nome do profissional..."
                            value={nomeProfissional}
                            onChange={(e) => setNomeProfissional(e.target.value)}
                            required
                          />
                        </div>
                        <datalist id="profissionais-list">
                          {nomesDistintos.map((nome, index) => (
                            <option key={index} value={nome} />
                          ))}
                        </datalist>
                        <div className="form-text small">
                          Único na OS por mês ({nomesDistintos.length} cadastrados).
                        </div>
                      </div>

                      {/* Percentual de Alocação */}
                      <div className="col-md-12">
                        <label className="form-label fw-semibold d-flex justify-content-between">
                          <span>
                            Percentual de Alocação (%) <span className="text-danger">*</span>
                          </span>
                          <span className="badge bg-primary fs-7">
                            {formatPercent(percentualAlocacao)}
                          </span>
                        </label>
                        <div className="d-flex align-items-center gap-3">
                          <input
                            type="range"
                            className="form-range flex-grow-1"
                            min="0.5"
                            max="100"
                            step="0.5"
                            value={percentualAlocacao}
                            onChange={(e) => setPercentualAlocacao(parseFloat(Number(e.target.value).toFixed(2)))}
                          />
                          <div className="input-group" style={{ width: 140 }}>
                            <input
                              type="number"
                              className="form-control text-center"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={percentualAlocacao}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (isNaN(val)) {
                                  setPercentualAlocacao(0);
                                } else {
                                  setPercentualAlocacao(Math.min(100, Math.max(0, parseFloat(val.toFixed(2)))));
                                }
                              }}
                            />
                            <span className="input-group-text">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simulation & Business Rule Live Box */}
                    <div className="mt-4 p-3 bg-light rounded-3 border">
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                        <div className="d-flex align-items-center text-primary fw-semibold small">
                          <i className="bi bi-cpu-fill me-2"></i>
                          <span>Simulador da Regra de Negócio & Constraints (CHECK & UNIQUE)</span>
                        </div>
                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                          Mês: {mesReferencia}
                        </span>
                      </div>
                      <div className="row g-3 text-center">
                        <div className="col-md-3">
                          <span className="text-muted small d-block">Doc. Referência (Copiado)</span>
                          <strong className="text-dark fs-7">{simulatedDocRef}</strong>
                        </div>
                        <div className="col-md-3">
                          <span className="text-muted small d-block">Custo Mensal Perfil (Copiado)</span>
                          <strong className="text-dark">{formatCurrency(simulatedCustoMensal)}</strong>
                        </div>
                        <div className="col-md-3">
                          <span className="text-muted small d-block">Percentual Alocado</span>
                          <strong className="text-primary">{formatPercent(percentualAlocacao)}</strong>
                        </div>
                        <div className="col-md-3 bg-white p-2 rounded border border-primary">
                          <span className="text-primary small d-block fw-semibold">
                            Custo da Alocação (Calculado)
                          </span>
                          <span className="fs-5 fw-bold text-success">
                            {formatCurrency(simulatedCustoAlocacao)}
                          </span>
                          <div className="text-muted" style={{ fontSize: '10px' }}>
                            ({formatPercent(percentualAlocacao)} × {formatCurrency(simulatedCustoMensal)}) ÷ 100
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-secondary px-3"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary px-4 fw-semibold">
                        <i className="bi bi-check2-circle me-1"></i>
                        {editingId ? 'Salvar Alterações' : 'Confirmar Alocação'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {/* List of allocations */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">
                  <i className="bi bi-list-check me-2 text-primary"></i>
                  Profissionais e Perfis Alocados nesta OS
                </h6>
                <small className="text-muted">
                  {osAlocacoes.length} {osAlocacoes.length === 1 ? 'alocação registrada' : 'alocações registradas'}
                </small>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 shadow-sm fw-semibold"
                  onClick={handleStartAdd}
                >
                  <i className="bi bi-plus-lg me-1"></i>
                  Adicionar Profissional / Perfil
                </button>
              )}
            </div>

            {osAlocacoes.length === 0 ? (
              <div className="text-center py-5 border rounded-3 bg-light">
                <i className="bi bi-people text-muted fs-1 d-block mb-2"></i>
                <h6 className="fw-semibold text-secondary">Nenhum perfil alocado nesta Ordem de Serviço</h6>
                <p className="text-muted small mb-3">
                  Clique no botão acima para associar os perfis contratados e profissionais a esta OS com seu respectivo mês de referência.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleStartAdd}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Alocar Primeiro Profissional
                </button>
              </div>
            ) : (
              <div className="table-responsive border rounded-3">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '22%' }}>Profissional</th>
                      <th style={{ width: '22%' }}>Perfil Contratado</th>
                      <th className="text-center" style={{ width: '12%' }}>Mês Ref.</th>
                      <th className="text-center" style={{ width: '10%' }}>% Aloc.</th>
                      <th style={{ width: '14%' }}>Doc. Ref.</th>
                      <th className="text-end" style={{ width: '10%' }}>Custo Mensal</th>
                      <th className="text-end" style={{ width: '10%' }}>Custo Aloc.</th>
                      <th className="text-center" style={{ width: '70px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {osAlocacoes.map((item) => {
                      const perfil = perfis.find((p) => p.id === item.perfil_contratado_id);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                style={{ width: 32, height: 32, fontSize: '13px' }}
                              >
                                {item.nome_profissional.charAt(0).toUpperCase()}
                              </div>
                              <span className="fw-semibold text-dark">
                                {item.nome_profissional}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="fw-medium text-dark">
                              {perfil?.nome_perfil || `Perfil ID ${item.perfil_contratado_id}`}
                            </div>
                            <small className="text-muted">
                              {perfil?.item_contratacao}
                            </small>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold">
                              {item.mes_referencia}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1">
                              {formatPercent(item.percentual_alocacao)}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border text-truncate d-inline-block" style={{ maxWidth: 140 }}>
                              {item.documento_referencia}
                            </span>
                          </td>
                          <td className="text-end text-muted font-monospace small">
                            {formatCurrency(item.custo_mensal_perfil)}
                          </td>
                          <td className="text-end fw-bold text-success font-monospace">
                            {formatCurrency(item.custo_alocacao)}
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                title="Alterar Ordem de Serviço"
                                onClick={() => {
                                  handleStartEdit(item);
                                  setIsAlterarOsModalOpen(true);
                                }}
                              >
                                <i className="bi bi-arrow-left-right"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                title="Editar alocação"
                                onClick={() => handleStartEdit(item)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                title="Remover alocação"
                                onClick={() => handleDelete(item.id, item.nome_profissional)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-group-divider bg-light">
                    <tr>
                      <td colSpan={6} className="text-end fw-bold text-dark py-3">
                        Valor Total da Ordem de Serviço (Soma das Alocações):
                      </td>
                      <td className="text-end fw-bold text-success fs-6 py-3 font-monospace">
                        {formatCurrency(valorTotalOS)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
            <div className="text-muted small">
              <i className="bi bi-info-circle me-1 text-primary"></i>
              Qualquer alteração nas alocações recalcula automaticamente o valor total desta OS.
            </div>
            <button
              type="button"
              className="btn btn-secondary px-4 fw-semibold"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pesquisa e Seleção para Alterar Ordem de Serviço */}
      <PesquisaOrdemServicoModal
        isOpen={isAlterarOsModalOpen}
        onClose={() => setIsAlterarOsModalOpen(false)}
        alocacao={alocacoes.find((a) => a.id === editingId) || null}
        currentOs={ordemServico}
        onConfirm={handleConfirmAlterarOs}
      />
    </div>
  );
};
