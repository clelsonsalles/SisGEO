import React, { useState, useEffect } from 'react';
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
  const { projetos, addOrdemServico, updateOrdemServico } = useSisgos();

  const [projetoId, setProjetoId] = useState<number | ''>('');
  const [numeroOs, setNumeroOs] = useState<number | ''>('');
  const [anoReferencia, setAnoReferencia] = useState<number>(2026);
  const [alocacaoSgc, setAlocacaoSgc] = useState<boolean>(false);
  const [entregaSgc, setEntregaSgc] = useState<boolean>(false);
  const [descricaoSgc, setDescricaoSgc] = useState<boolean>(false);
  const [situacaoSgc, setSituacaoSgc] = useState<string>('Em Elaboração');
  const [situacaoPassivo2026, setSituacaoPassivo2026] = useState<string>('Sem Passivo');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editingOs) {
      setProjetoId(editingOs.projeto_id);
      setNumeroOs(editingOs.numero_os);
      setAnoReferencia(editingOs.ano_referencia);
      setAlocacaoSgc(editingOs.alocacao_sgc);
      setEntregaSgc(editingOs.entrega_sgc);
      setDescricaoSgc(editingOs.descricao_sgc);
      setSituacaoSgc(editingOs.situacao_sgc);
      setSituacaoPassivo2026(editingOs.situacao_passivo_2026);
    } else {
      setProjetoId(projetos.length > 0 ? projetos[0].id : '');
      setNumeroOs('');
      setAnoReferencia(2026);
      setAlocacaoSgc(false);
      setEntregaSgc(false);
      setDescricaoSgc(false);
      setSituacaoSgc('Em Elaboração');
      setSituacaoPassivo2026('Sem Passivo');
    }
    setErrorMsg('');
  }, [editingOs, isOpen, projetos]);

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
    if (!anoReferencia || anoReferencia < 2000 || anoReferencia > 2100) {
      setErrorMsg('Informe um ano de referência válido.');
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
          situacao_sgc: situacaoSgc,
          situacao_passivo_2026: situacaoPassivo2026,
        });
      } else {
        addOrdemServico({
          projeto_id: Number(projetoId),
          numero_os: Number(numeroOs),
          ano_referencia: Number(anoReferencia),
          alocacao_sgc: alocacaoSgc,
          entrega_sgc: entregaSgc,
          descricao_sgc: descricaoSgc,
          situacao_sgc: situacaoSgc,
          situacao_passivo_2026: situacaoPassivo2026,
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
                    min="2020"
                    max="2035"
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
                  <label className="form-label fw-semibold">Situação no SGC</label>
                  <select
                    className="form-select"
                    value={situacaoSgc}
                    onChange={(e) => setSituacaoSgc(e.target.value)}
                  >
                    <option value="Em Elaboração">Em Elaboração</option>
                    <option value="Em Execução">Em Execução</option>
                    <option value="Em Validação SGC">Em Validação SGC</option>
                    <option value="Atestada pelo Fiscal">Atestada pelo Fiscal</option>
                    <option value="Finalizada">Finalizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Situação Passivo 2026 */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Situação Passivo 2026</label>
                  <select
                    className="form-select"
                    value={situacaoPassivo2026}
                    onChange={(e) => setSituacaoPassivo2026(e.target.value)}
                  >
                    <option value="Sem Passivo">Sem Passivo</option>
                    <option value="Passivo Reconhecido">Passivo Reconhecido</option>
                    <option value="A Empenhar">A Empenhar</option>
                    <option value="Empenhado">Empenhado</option>
                    <option value="Liquidado">Liquidado</option>
                    <option value="Pago">Pago</option>
                  </select>
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
