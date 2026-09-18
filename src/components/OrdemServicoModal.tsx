import React, { useState, useEffect, useMemo } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { OrdemServico } from '../types/models';

interface OrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOs: OrdemServico | null;
}

export const OrdemServicoModal: React.FC<OrdemServicoModalProps> = ({
  isOpen,
  onClose,
  editingOs,
}) => {
  const {
    projetos,
    ordensServico,
    addOrdemServico,
    updateOrdemServico,
    carregarSituacoesDoBanco,
  } = useSisgos();

  const [projetoId, setProjetoId] = useState<number | ''>('');
  const [numeroOs, setNumeroOs] = useState<number | ''>('');
  const [anoReferencia, setAnoReferencia] = useState<number>(2026);
  const [alocacaoSgc, setAlocacaoSgc] = useState<boolean>(false);
  const [entregaSgc, setEntregaSgc] = useState<boolean>(false);
  const [descricaoSgc, setDescricaoSgc] = useState<boolean>(false);

  // Situação no SGC (Seleção e/ou Novo Valor)
  const [situacaoSgc, setSituacaoSgc] = useState<string>('');
  const [isNovoSituacaoSgc, setIsNovoSituacaoSgc] = useState<boolean>(false);
  const [novoSituacaoSgcTexto, setNovoSituacaoSgcTexto] = useState<string>('');

  // Situação Passivo 2026 (Seleção e/ou Novo Valor)
  const [situacaoPassivo2026, setSituacaoPassivo2026] = useState<string>('');
  const [isNovoSituacaoPassivo, setIsNovoSituacaoPassivo] = useState<boolean>(false);
  const [novoSituacaoPassivoTexto, setNovoSituacaoPassivoTexto] = useState<string>('');

  const [nePlanejamento, setNePlanejamento] = useState<string>('');
  const [neFaturamento, setNeFaturamento] = useState<string>('');
  const [processoSeiPagamento, setProcessoSeiPagamento] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Carrega situações atualizadas do banco ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarSituacoesDoBanco().catch(() => {});
    }
  }, [isOpen, carregarSituacoesDoBanco]);

  // Lista dinâmica montada estritamente a partir dos valores existentes no banco de dados para Situação no SGC
  const opcoesSituacaoSgc = useMemo(() => {
    const doBanco = Array.from(
      new Set(
        ordensServico
          .map((os) => (os.situacao_sgc || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Inclui a situação da OS em edição se não estiver na lista
    if (editingOs?.situacao_sgc && editingOs.situacao_sgc.trim() && !doBanco.includes(editingOs.situacao_sgc.trim())) {
      doBanco.push(editingOs.situacao_sgc.trim());
      doBanco.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    return doBanco;
  }, [ordensServico, editingOs]);

  // Contagem de registros no banco para cada Situação no SGC
  const contagemSgcBanco = useMemo(() => {
    const counts: Record<string, number> = {};
    ordensServico.forEach((os) => {
      const val = (os.situacao_sgc || '').trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  }, [ordensServico]);

  // Lista dinâmica montada estritamente a partir dos valores existentes no banco de dados para Situação Passivo 2026
  const opcoesSituacaoPassivo = useMemo(() => {
    const doBanco = Array.from(
      new Set(
        ordensServico
          .map((os) => (os.situacao_passivo_2026 || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    // Inclui a situação da OS em edição se não estiver na lista
    if (editingOs?.situacao_passivo_2026 && editingOs.situacao_passivo_2026.trim() && !doBanco.includes(editingOs.situacao_passivo_2026.trim())) {
      doBanco.push(editingOs.situacao_passivo_2026.trim());
      doBanco.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    return doBanco;
  }, [ordensServico, editingOs]);

  // Contagem de registros no banco para cada Situação Passivo 2026
  const contagemPassivoBanco = useMemo(() => {
    const counts: Record<string, number> = {};
    ordensServico.forEach((os) => {
      const val = (os.situacao_passivo_2026 || '').trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return counts;
  }, [ordensServico]);

  useEffect(() => {
    if (editingOs) {
      setProjetoId(editingOs.projeto_id);
      setNumeroOs(editingOs.numero_os);
      setAnoReferencia(editingOs.ano_referencia);
      setAlocacaoSgc(editingOs.alocacao_sgc);
      setEntregaSgc(editingOs.entrega_sgc);
      setDescricaoSgc(editingOs.descricao_sgc);
      
      const valorSgc = editingOs.situacao_sgc || (opcoesSituacaoSgc.length > 0 ? opcoesSituacaoSgc[0] : '');
      setSituacaoSgc(valorSgc);
      setIsNovoSituacaoSgc(false);
      setNovoSituacaoSgcTexto('');

      const valorPassivo = editingOs.situacao_passivo_2026 || (opcoesSituacaoPassivo.length > 0 ? opcoesSituacaoPassivo[0] : '');
      setSituacaoPassivo2026(valorPassivo);
      setIsNovoSituacaoPassivo(false);
      setNovoSituacaoPassivoTexto('');

      setNePlanejamento(editingOs.ne_planejamento || '');
      setNeFaturamento(editingOs.ne_faturamento || '');
      setProcessoSeiPagamento(editingOs.processo_sei_pagamento || '');
    } else {
      setProjetoId(projetos.length > 0 ? projetos[0].id : '');
      setNumeroOs('');
      setAnoReferencia(2026);
      setAlocacaoSgc(false);
      setEntregaSgc(false);
      setDescricaoSgc(false);
      
      // Inclusão: seleciona dinamicamente a partir dos valores existentes no banco de dados
      const padraoSgc = opcoesSituacaoSgc.includes('Em Execução')
        ? 'Em Execução'
        : (opcoesSituacaoSgc.length > 0 ? opcoesSituacaoSgc[0] : 'Em Execução');
      setSituacaoSgc(padraoSgc);
      setIsNovoSituacaoSgc(opcoesSituacaoSgc.length === 0);
      setNovoSituacaoSgcTexto('');

      const padraoPassivo = opcoesSituacaoPassivo.includes('Sem Passivo')
        ? 'Sem Passivo'
        : (opcoesSituacaoPassivo.length > 0 ? opcoesSituacaoPassivo[0] : 'Sem Passivo');
      setSituacaoPassivo2026(padraoPassivo);
      setIsNovoSituacaoPassivo(opcoesSituacaoPassivo.length === 0);
      setNovoSituacaoPassivoTexto('');

      setNePlanejamento('');
      setNeFaturamento('');
      setProcessoSeiPagamento('');
    }
    setErrorMsg('');
  }, [editingOs, isOpen, projetos, opcoesSituacaoSgc, opcoesSituacaoPassivo]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projetoId) {
      setErrorMsg('Selecione um projeto associado.');
      return;
    }
    if (!numeroOs || Number(numeroOs) <= 0) {
      setErrorMsg('Informe um número de OS válido (maior que zero).');
      return;
    }
    if (!anoReferencia || isNaN(Number(anoReferencia))) {
      setErrorMsg('Informe o ano de referência.');
      return;
    }

    // Validação da Situação no SGC (novo valor ou selecionado)
    const finalSituacaoSgc = isNovoSituacaoSgc ? novoSituacaoSgcTexto.trim() : situacaoSgc.trim();
    if (!finalSituacaoSgc) {
      setErrorMsg('Informe o valor para o campo "Situação no SGC" ou retorne à lista de opções.');
      return;
    }

    // Validação da Situação Passivo 2026 (novo valor ou selecionado)
    const finalSituacaoPassivo = isNovoSituacaoPassivo ? novoSituacaoPassivoTexto.trim() : situacaoPassivo2026.trim();
    if (!finalSituacaoPassivo) {
      setErrorMsg('Informe o valor para o campo "Situação Passivo 2026" ou retorne à lista de opções.');
      return;
    }

    try {
      if (editingOs) {
        updateOrdemServico(editingOs.id, {
          projeto_id: Number(projetoId),
          numero_os: Number(numeroOs),
          ano_referencia: Number(anoReferencia),
          alocacao_sgc: alocacaoSgc,
          entrega_sgc: entregaSgc,
          descricao_sgc: descricaoSgc,
          situacao_sgc: finalSituacaoSgc,
          situacao_passivo_2026: finalSituacaoPassivo,
          ne_planejamento: nePlanejamento.trim() || null,
          ne_faturamento: neFaturamento.trim() || null,
          processo_sei_pagamento: processoSeiPagamento.trim() || null,
        });
      } else {
        addOrdemServico({
          projeto_id: Number(projetoId),
          numero_os: Number(numeroOs),
          ano_referencia: Number(anoReferencia),
          alocacao_sgc: alocacaoSgc,
          entrega_sgc: entregaSgc,
          descricao_sgc: descricaoSgc,
          situacao_sgc: finalSituacaoSgc,
          situacao_passivo_2026: finalSituacaoPassivo,
          ne_planejamento: nePlanejamento.trim() || null,
          ne_faturamento: neFaturamento.trim() || null,
          processo_sei_pagamento: processoSeiPagamento.trim() || null,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar a Ordem de Serviço.');
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
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-dark text-white py-3 px-4">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-file-earmark-text me-2 text-primary"></i>
              {editingOs ? `Editar Ordem de Serviço #${editingOs.numero_os}` : 'Nova Ordem de Serviço'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="row g-3">
                {/* Projeto Vinculado */}
                <div className="col-md-12">
                  <label className="form-label fw-semibold">
                    Projeto Associado <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={projetoId}
                    onChange={(e) => setProjetoId(Number(e.target.value))}
                    required
                  >
                    <option value="">-- Selecione o Projeto --</option>
                    {projetos.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.sigla_projeto} - {proj.nome_projeto} ({proj.sigla_secretaria})
                      </option>
                    ))}
                  </select>
                  <div className="form-text small">
                    A OS será vinculada a este projeto (Chave Estrangeira: <code>projeto_id</code>).
                  </div>
                </div>

                {/* Número da OS */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Número da OS <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ex: 101"
                    min="1"
                    value={numeroOs}
                    onChange={(e) => setNumeroOs(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                </div>

                {/* Ano de Referência */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Ano de Referência <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={anoReferencia}
                    onChange={(e) => setAnoReferencia(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Indicadores SGC (Checkboxes) */}
                <div className="col-md-12">
                  <label className="form-label fw-semibold d-block">
                    Controles e Indicadores SGC (Sistema de Gestão de Contratos)
                  </label>
                  <div className="d-flex flex-wrap gap-4 p-3 bg-light rounded border">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="checkAlocacaoSgc"
                        checked={alocacaoSgc}
                        onChange={(e) => setAlocacaoSgc(e.target.checked)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="checkAlocacaoSgc">
                        Alocação SGC
                      </label>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="checkEntregaSgc"
                        checked={entregaSgc}
                        onChange={(e) => setEntregaSgc(e.target.checked)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="checkEntregaSgc">
                        Entrega SGC
                      </label>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="checkDescricaoSgc"
                        checked={descricaoSgc}
                        onChange={(e) => setDescricaoSgc(e.target.checked)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="checkDescricaoSgc">
                        Descrição SGC
                      </label>
                    </div>
                  </div>
                </div>

                {/* Situação no SGC */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold mb-0" htmlFor="selectSituacaoSgc">
                      Situação no SGC
                    </label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                      style={{ fontSize: '12px' }}
                      onClick={() => {
                        setIsNovoSituacaoSgc(!isNovoSituacaoSgc);
                        if (!isNovoSituacaoSgc) {
                          setNovoSituacaoSgcTexto('');
                        }
                      }}
                      title={isNovoSituacaoSgc ? 'Voltar para a lista' : 'Informar um novo valor personalizado'}
                    >
                      {isNovoSituacaoSgc ? (
                        <span className="text-secondary">
                          <i className="bi bi-list-ul me-1"></i>Escolher da lista
                        </span>
                      ) : (
                        <span className="text-primary">
                          <i className="bi bi-plus-circle me-1"></i>+ Informar novo valor
                        </span>
                      )}
                    </button>
                  </div>

                  {isNovoSituacaoSgc ? (
                    <div>
                      <div className="input-group">
                        <span className="input-group-text bg-primary-subtle text-primary border-primary">
                          <i className="bi bi-pencil-fill"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-primary"
                          placeholder="Digite a nova situação no SGC..."
                          value={novoSituacaoSgcTexto}
                          onChange={(e) => setNovoSituacaoSgcTexto(e.target.value)}
                          maxLength={100}
                          list="datalist-situacao-sgc"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setIsNovoSituacaoSgc(false);
                            setNovoSituacaoSgcTexto('');
                          }}
                          title="Voltar à lista existente"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-primary fw-medium" style={{ fontSize: '11px' }}>
                          <i className="bi bi-info-circle me-1"></i>
                          Cadastrando novo valor para o SGC nesta OS.
                        </small>
                        <span className="text-muted" style={{ fontSize: '10px' }}>
                          {novoSituacaoSgcTexto.length}/100
                        </span>
                      </div>
                      <datalist id="datalist-situacao-sgc">
                        {opcoesSituacaoSgc.map((op) => (
                          <option key={op} value={op} />
                        ))}
                      </datalist>
                    </div>
                  ) : (
                    <div>
                      <select
                        id="selectSituacaoSgc"
                        className="form-select"
                        value={situacaoSgc}
                        onChange={(e) => {
                          if (e.target.value === '__NOVO__') {
                            setIsNovoSituacaoSgc(true);
                            setNovoSituacaoSgcTexto('');
                          } else {
                            setSituacaoSgc(e.target.value);
                          }
                        }}
                      >
                        {opcoesSituacaoSgc.length === 0 ? (
                          <option value="">Nenhuma situação cadastrada no banco</option>
                        ) : (
                          opcoesSituacaoSgc.map((op) => {
                            const qtd = contagemSgcBanco[op] || 0;
                            return (
                              <option key={op} value={op}>
                                {op} {qtd > 0 ? `(${qtd} no banco)` : ''}
                              </option>
                            );
                          })
                        )}
                        <option value="__NOVO__" className="fw-bold text-primary">
                          ✨ + Informar outro novo valor...
                        </option>
                      </select>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          <i className="bi bi-database me-1 text-success"></i>
                          Lista dinâmica: <strong>{opcoesSituacaoSgc.length}</strong> {opcoesSituacaoSgc.length === 1 ? 'situação no banco' : 'situações no banco'}
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Situação Passivo 2026 */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold mb-0" htmlFor="selectSituacaoPassivo">
                      Situação Passivo 2026
                    </label>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                      style={{ fontSize: '12px' }}
                      onClick={() => {
                        setIsNovoSituacaoPassivo(!isNovoSituacaoPassivo);
                        if (!isNovoSituacaoPassivo) {
                          setNovoSituacaoPassivoTexto('');
                        }
                      }}
                      title={isNovoSituacaoPassivo ? 'Voltar para a lista' : 'Informar um novo valor personalizado'}
                    >
                      {isNovoSituacaoPassivo ? (
                        <span className="text-secondary">
                          <i className="bi bi-list-ul me-1"></i>Escolher da lista
                        </span>
                      ) : (
                        <span className="text-primary">
                          <i className="bi bi-plus-circle me-1"></i>+ Informar novo valor
                        </span>
                      )}
                    </button>
                  </div>

                  {isNovoSituacaoPassivo ? (
                    <div>
                      <div className="input-group">
                        <span className="input-group-text bg-primary-subtle text-primary border-primary">
                          <i className="bi bi-pencil-fill"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-primary"
                          placeholder="Digite a nova situação do passivo 2026..."
                          value={novoSituacaoPassivoTexto}
                          onChange={(e) => setNovoSituacaoPassivoTexto(e.target.value)}
                          maxLength={100}
                          list="datalist-situacao-passivo"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setIsNovoSituacaoPassivo(false);
                            setNovoSituacaoPassivoTexto('');
                          }}
                          title="Voltar à lista existente"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-primary fw-medium" style={{ fontSize: '11px' }}>
                          <i className="bi bi-info-circle me-1"></i>
                          Cadastrando novo valor para o Passivo nesta OS.
                        </small>
                        <span className="text-muted" style={{ fontSize: '10px' }}>
                          {novoSituacaoPassivoTexto.length}/100
                        </span>
                      </div>
                      <datalist id="datalist-situacao-passivo">
                        {opcoesSituacaoPassivo.map((op) => (
                          <option key={op} value={op} />
                        ))}
                      </datalist>
                    </div>
                  ) : (
                    <div>
                      <select
                        id="selectSituacaoPassivo"
                        className="form-select"
                        value={situacaoPassivo2026}
                        onChange={(e) => {
                          if (e.target.value === '__NOVO__') {
                            setIsNovoSituacaoPassivo(true);
                            setNovoSituacaoPassivoTexto('');
                          } else {
                            setSituacaoPassivo2026(e.target.value);
                          }
                        }}
                      >
                        {opcoesSituacaoPassivo.length === 0 ? (
                          <option value="">Nenhuma situação cadastrada no banco</option>
                        ) : (
                          opcoesSituacaoPassivo.map((op) => {
                            const qtd = contagemPassivoBanco[op] || 0;
                            return (
                              <option key={op} value={op}>
                                {op} {qtd > 0 ? `(${qtd} no banco)` : ''}
                              </option>
                            );
                          })
                        )}
                        <option value="__NOVO__" className="fw-bold text-primary">
                          ✨ + Informar outro novo valor...
                        </option>
                      </select>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <small className="text-muted" style={{ fontSize: '11px' }}>
                          <i className="bi bi-database me-1 text-success"></i>
                          Lista dinâmica: <strong>{opcoesSituacaoPassivo.length}</strong> {opcoesSituacaoPassivo.length === 1 ? 'situação no banco' : 'situações no banco'}
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notas de Empenho (NE) e Processo SEI */}
                <div className="col-12">
                  <hr className="my-2" />
                  <h6 className="fw-bold text-secondary mb-2">
                    <i className="bi bi-receipt me-1"></i>
                    Empenho e Processo de Pagamento
                  </h6>
                </div>

                {/* NE no Planejamento */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    NE no Planejamento
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 2026NE000142"
                    value={nePlanejamento}
                    onChange={(e) => setNePlanejamento(e.target.value)}
                  />
                  <div className="form-text small">Nota de empenho prevista.</div>
                </div>

                {/* NE no Faturamento */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    NE no Faturamento
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 2026NE000189"
                    value={neFaturamento}
                    onChange={(e) => setNeFaturamento(e.target.value)}
                  />
                  <div className="form-text small">Nota de empenho executada.</div>
                </div>

                {/* Processo SEI Pagamento */}
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    Processo SEI Pagamento
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 08001.002341/2026-12"
                    value={processoSeiPagamento}
                    onChange={(e) => setProcessoSeiPagamento(e.target.value)}
                  />
                  <div className="form-text small">Número do processo SEI (opcional).</div>
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3">
              <button type="button" className="btn btn-secondary px-3" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary px-4 fw-semibold">
                <i className="bi bi-check-lg me-1"></i>
                {editingOs ? 'Atualizar OS' : 'Salvar Ordem de Serviço'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
