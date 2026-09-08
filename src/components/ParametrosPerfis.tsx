import React, { useState } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { PerfilContratado } from '../types/models';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const ParametrosPerfis: React.FC = () => {
  const {
    perfis,
    alocacoes,
    addPerfil,
    updatePerfil,
    deletePerfil,
    toggleVigenciaPerfil,
  } = useSisgos();

  const [searchQuery, setSearchQuery] = useState('');
  const [filtroVigencia, setFiltroVigencia] = useState<'TODOS' | 'SIM' | 'NAO'>('TODOS');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<PerfilContratado | null>(null);

  // Form state
  const [itemContratacao, setItemContratacao] = useState('');
  const [nomePerfil, setNomePerfil] = useState('');
  const [documentoReferencia, setDocumentoReferencia] = useState('');
  const [vigente, setVigente] = useState(true);
  const [custoMensal, setCustoMensal] = useState<number | ''>('');
  const [quantidadeMensal, setQuantidadeMensal] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingPerfil(null);
    setItemContratacao('');
    setNomePerfil('');
    setDocumentoReferencia('');
    setVigente(true);
    setCustoMensal('');
    setQuantidadeMensal('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: PerfilContratado) => {
    setEditingPerfil(p);
    setItemContratacao(p.item_contratacao);
    setNomePerfil(p.nome_perfil);
    setDocumentoReferencia(p.documento_referencia);
    setVigente(p.vigente);
    setCustoMensal(p.custo_mensal_perfil);
    setQuantidadeMensal(p.quantidade_mensal_contratada);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemContratacao.trim()) {
      setErrorMsg('Informe o Item da Contratação (ex: Item 01).');
      return;
    }
    if (!nomePerfil.trim()) {
      setErrorMsg('Informe o Nome do Perfil.');
      return;
    }
    if (!documentoReferencia.trim()) {
      setErrorMsg('Informe o Documento de Referência (ex: Contrato 45/2024 - Lote 1).');
      return;
    }
    if (custoMensal === '' || Number(custoMensal) <= 0) {
      setErrorMsg('Informe um Custo Mensal válido maior que zero.');
      return;
    }
    if (quantidadeMensal === '' || Number(quantidadeMensal) <= 0) {
      setErrorMsg('Informe uma Quantidade Mensal Contratada válida maior que zero.');
      return;
    }

    try {
      if (editingPerfil) {
        updatePerfil(editingPerfil.id, {
          item_contratacao: itemContratacao.trim(),
          nome_perfil: nomePerfil.trim(),
          documento_referencia: documentoReferencia.trim(),
          vigente,
          custo_mensal_perfil: Number(custoMensal),
          quantidade_mensal_contratada: Number(quantidadeMensal),
        });
      } else {
        addPerfil({
          item_contratacao: itemContratacao.trim(),
          nome_perfil: nomePerfil.trim(),
          documento_referencia: documentoReferencia.trim(),
          vigente,
          custo_mensal_perfil: Number(custoMensal),
          quantidade_mensal_contratada: Number(quantidadeMensal),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar perfil contratado.');
    }
  };

  const handleDelete = (p: PerfilContratado) => {
    const alocacoesCount = alocacoes.filter((a) => a.perfil_contratado_id === p.id).length;
    if (alocacoesCount > 0) {
      alert(
        `Não é possível excluir o perfil "${p.nome_perfil}" pois ele possui ${alocacoesCount} alocação(ões) vinculada(s) a Ordens de Serviço.\n\nDica: Desative a opção "Vigente" para que ele não seja mais sugerido para novas alocações.`
      );
      return;
    }

    if (window.confirm(`Confirma a exclusão do perfil "${p.nome_perfil}" (${p.item_contratacao})?`)) {
      const res = deletePerfil(p.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const filteredPerfis = perfis.filter((p) => {
    const searchMatch =
      searchQuery.trim() === '' ||
      p.nome_perfil.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.item_contratacao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.documento_referencia.toLowerCase().includes(searchQuery.toLowerCase());

    const vigenciaMatch =
      filtroVigencia === 'TODOS' ||
      (filtroVigencia === 'SIM' && p.vigente) ||
      (filtroVigencia === 'NAO' && !p.vigente);

    return searchMatch && vigenciaMatch;
  });

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 fw-bold">
              Parâmetros do Sistema
            </span>
            <span className="text-muted small">
              Tabela: <code>perfis_contratados</code>
            </span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Cadastro de Perfis Contratados</h2>
          <p className="text-muted mb-0 small">
            Gerenciamento dos perfis de profissionais licitados/contratados, valores de referência e quantidades.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
          onClick={openCreateModal}
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>Novo Perfil Contratado</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filtrar por nome do perfil, item ou contrato..."
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

            <div className="col-6 col-md-4">
              <select
                className="form-select"
                value={filtroVigencia}
                onChange={(e) => setFiltroVigencia(e.target.value as any)}
              >
                <option value="TODOS">Todas as Situações de Vigência</option>
                <option value="SIM">Apenas Perfis Vigentes (Ativos)</option>
                <option value="NAO">Apenas Perfis Não Vigentes (Inativos)</option>
              </select>
            </div>

            <div className="col-6 col-md-2 text-md-end">
              <span className="text-muted small fw-medium">
                {filteredPerfis.length} de {perfis.length} registros
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark">
            <i className="bi bi-people me-2 text-primary"></i>
            Perfis Contratados Homologados
          </span>
          <span className="badge bg-light text-secondary border">
            {perfis.filter((p) => p.vigente).length} Vigentes
          </span>
        </div>

        {filteredPerfis.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="bi bi-person-x text-muted fs-1 d-block mb-2"></i>
            <h5 className="text-secondary fw-semibold">Nenhum perfil contratado encontrado</h5>
            <p className="text-muted small mb-3">Tente alterar os filtros ou cadastre um novo perfil.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
              <i className="bi bi-plus-circle me-1"></i>
              Cadastrar Novo Perfil
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '110px' }}>Item</th>
                  <th style={{ width: '30%' }}>Nome do Perfil</th>
                  <th style={{ width: '25%' }}>Documento de Referência</th>
                  <th className="text-center" style={{ width: '100px' }}>Vigente</th>
                  <th className="text-end" style={{ width: '160px' }}>Custo Mensal</th>
                  <th className="text-center" style={{ width: '130px' }}>Qtd. Contratada</th>
                  <th className="text-center" style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPerfis.map((p) => {
                  const alocadosCount = alocacoes.filter((a) => a.perfil_contratado_id === p.id).length;
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="badge bg-dark px-2 py-1 fs-7">
                          {p.item_contratacao}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{p.nome_perfil}</div>
                        <small className="text-muted">
                          {alocadosCount} alocação(ões) ativa(s) no sistema
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {p.documento_referencia}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className={`badge border ${
                            p.vigente
                              ? 'bg-success-subtle text-success border-success-subtle'
                              : 'bg-danger-subtle text-danger border-danger-subtle'
                          }`}
                          style={{ cursor: 'pointer' }}
                          title="Clique para alternar vigência"
                          onClick={() => toggleVigenciaPerfil(p.id)}
                        >
                          <i className={`bi ${p.vigente ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                          {p.vigente ? 'Sim' : 'Não'}
                        </button>
                      </td>
                      <td className="text-end fw-bold text-dark font-monospace">
                        {formatCurrency(p.custo_mensal_perfil)}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-7">
                          {formatNumber(p.quantidade_mensal_contratada)} prof.
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => openEditModal(p)}
                            title="Editar Perfil"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(p)}
                            title="Excluir Perfil"
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

      {/* Modal CRUD Perfil */}
      {isModalOpen && (
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
                  <i className="bi bi-person-badge me-2 text-primary"></i>
                  {editingPerfil ? `Editar Perfil (${editingPerfil.item_contratacao})` : 'Novo Perfil Contratado'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
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
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Item da Contratação <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Item 01"
                        value={itemContratacao}
                        onChange={(e) => setItemContratacao(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label fw-semibold">
                        Nome do Perfil <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Desenvolvedor Full-Stack Sênior"
                        value={nomePerfil}
                        onChange={(e) => setNomePerfil(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">
                        Documento de Referência <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Contrato 45/2024 - Lote 1"
                        value={documentoReferencia}
                        onChange={(e) => setDocumentoReferencia(e.target.value)}
                        required
                      />
                      <div className="form-text small">
                        Este valor será copiado automaticamente como snapshot para a tabela <code>alocacoes_perfil_os</code>.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Custo Mensal do Perfil (R$) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light fw-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control"
                          placeholder="0.00"
                          value={custoMensal}
                          onChange={(e) => setCustoMensal(e.target.value === '' ? '' : Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="form-text small">
                        Valor base mensal para cálculo proporcional da alocação de equipe.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Quantidade Mensal Contratada <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        placeholder="Ex: 5"
                        value={quantidadeMensal}
                        onChange={(e) => setQuantidadeMensal(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="col-md-12">
                      <div className="form-check form-switch p-3 bg-light rounded border">
                        <input
                          className="form-check-input ms-0 me-3"
                          type="checkbox"
                          role="switch"
                          id="checkVigente"
                          checked={vigente}
                          onChange={(e) => setVigente(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="checkVigente">
                          Perfil Vigente (Ativo para Alocações)
                        </label>
                        <div className="text-muted small ps-5">
                          Perfis não vigentes são mantidos para histórico contábil, mas sinalizados na seleção.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold">
                    <i className="bi bi-check-lg me-1"></i>
                    {editingPerfil ? 'Salvar Alterações' : 'Cadastrar Perfil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
