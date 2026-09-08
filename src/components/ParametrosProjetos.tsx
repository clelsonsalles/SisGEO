import React, { useState } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { Projeto } from '../types/models';

export const ParametrosProjetos: React.FC = () => {
  const { projetos, ordensServico, addProjeto, updateProjeto, deleteProjeto } = useSisgos();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<Projeto | null>(null);

  // Form states
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [siglaProjeto, setSiglaProjeto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nomeSecretaria, setNomeSecretaria] = useState('');
  const [siglaSecretaria, setSiglaSecretaria] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingProjeto(null);
    setNomeProjeto('');
    setSiglaProjeto('');
    setDescricao('');
    setNomeSecretaria('');
    setSiglaSecretaria('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Projeto) => {
    setEditingProjeto(p);
    setNomeProjeto(p.nome_projeto);
    setSiglaProjeto(p.sigla_projeto);
    setDescricao(p.descricao);
    setNomeSecretaria(p.nome_secretaria);
    setSiglaSecretaria(p.sigla_secretaria);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProjeto.trim()) {
      setErrorMsg('Informe o Nome do Projeto.');
      return;
    }
    if (!siglaProjeto.trim()) {
      setErrorMsg('Informe a Sigla do Projeto.');
      return;
    }
    if (!nomeSecretaria.trim()) {
      setErrorMsg('Informe o Nome da Secretaria.');
      return;
    }
    if (!siglaSecretaria.trim()) {
      setErrorMsg('Informe a Sigla da Secretaria.');
      return;
    }

    try {
      if (editingProjeto) {
        updateProjeto(editingProjeto.id, {
          nome_projeto: nomeProjeto.trim(),
          sigla_projeto: siglaProjeto.trim().toUpperCase(),
          descricao: descricao.trim(),
          nome_secretaria: nomeSecretaria.trim(),
          sigla_secretaria: siglaSecretaria.trim().toUpperCase(),
        });
      } else {
        addProjeto({
          nome_projeto: nomeProjeto.trim(),
          sigla_projeto: siglaProjeto.trim().toUpperCase(),
          descricao: descricao.trim(),
          nome_secretaria: nomeSecretaria.trim(),
          sigla_secretaria: siglaSecretaria.trim().toUpperCase(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar projeto.');
    }
  };

  const handleDelete = (p: Projeto) => {
    const osCount = ordensServico.filter((os) => os.projeto_id === p.id).length;
    if (osCount > 0) {
      alert(
        `Não é possível excluir o projeto "${p.sigla_projeto}" pois existem ${osCount} Ordem(ns) de Serviço vinculada(s) a ele.\n\nRestrição de Integridade Referencial (Foreign Key ON DELETE RESTRICT).`
      );
      return;
    }

    if (window.confirm(`Confirma a exclusão definitiva do projeto "${p.nome_projeto}" (${p.sigla_projeto})?`)) {
      const res = deleteProjeto(p.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const filteredProjetos = projetos.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      searchQuery.trim() === '' ||
      p.nome_projeto.toLowerCase().includes(q) ||
      p.sigla_projeto.toLowerCase().includes(q) ||
      p.nome_secretaria.toLowerCase().includes(q) ||
      p.sigla_secretaria.toLowerCase().includes(q) ||
      p.descricao.toLowerCase().includes(q)
    );
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
              Tabela: <code>projetos</code>
            </span>
          </div>
          <h2 className="fw-bold text-dark mb-0">Cadastro de Projetos</h2>
          <p className="text-muted mb-0 small">
            Gestão dos projetos governamentais, secretarias de vinculação e siglas de controle.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
          onClick={openCreateModal}
        >
          <i className="bi bi-folder-plus"></i>
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nome do projeto, sigla, secretaria ou descrição..."
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

            <div className="col-12 col-md-4 text-md-end">
              <span className="text-muted small fw-medium">
                {filteredProjetos.length} de {projetos.length} projetos cadastrados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark">
            <i className="bi bi-folder2-open me-2 text-primary"></i>
            Projetos Registrados no SisGOS
          </span>
          <span className="badge bg-light text-secondary border">
            {projetos.length} Projetos Ativos
          </span>
        </div>

        {filteredProjetos.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="bi bi-folder-x text-muted fs-1 d-block mb-2"></i>
            <h5 className="text-secondary fw-semibold">Nenhum projeto encontrado</h5>
            <p className="text-muted small mb-3">Tente alterar a busca ou cadastre um novo projeto.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
              <i className="bi bi-plus-circle me-1"></i>
              Cadastrar Novo Projeto
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '130px' }}>Sigla</th>
                  <th style={{ width: '32%' }}>Nome do Projeto</th>
                  <th style={{ width: '28%' }}>Secretaria Responsável</th>
                  <th className="text-center" style={{ width: '110px' }}>OSs Vinculadas</th>
                  <th className="text-center" style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjetos.map((p) => {
                  const osVinculadas = ordensServico.filter((os) => os.projeto_id === p.id);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="badge bg-primary px-2 py-1 fs-7">
                          {p.sigla_projeto}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{p.nome_projeto}</div>
                        <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: 380 }}>
                          {p.descricao || 'Sem descrição cadastrada.'}
                        </p>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{p.nome_secretaria}</div>
                        <span className="badge bg-light text-secondary border">
                          Sigla: {p.sigla_secretaria}
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            osVinculadas.length > 0
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-light text-muted border'
                          } px-2 py-1`}
                        >
                          <i className="bi bi-file-earmark-text me-1"></i>
                          {osVinculadas.length} OS{osVinculadas.length === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => openEditModal(p)}
                            title="Editar Projeto"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(p)}
                            title="Excluir Projeto"
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

      {/* Modal CRUD Projeto */}
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
                  <i className="bi bi-folder-check me-2 text-primary"></i>
                  {editingProjeto ? `Editar Projeto (${editingProjeto.sigla_projeto})` : 'Novo Projeto'}
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
                        Sigla do Projeto <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="Ex: SGC-CORP"
                        value={siglaProjeto}
                        onChange={(e) => setSiglaProjeto(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label fw-semibold">
                        Nome do Projeto <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Sistema de Gestão Corporativa Integrada"
                        value={nomeProjeto}
                        onChange={(e) => setNomeProjeto(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Descrição do Projeto</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Descreva o escopo e objetivo governamental deste projeto..."
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label fw-semibold">
                        Nome da Secretaria <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Secretaria de Estado de Planejamento e Gestão"
                        value={nomeSecretaria}
                        onChange={(e) => setNomeSecretaria(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Sigla da Secretaria <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        placeholder="Ex: SEPLAG"
                        value={siglaSecretaria}
                        onChange={(e) => setSiglaSecretaria(e.target.value)}
                        required
                      />
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
                    {editingProjeto ? 'Salvar Alterações' : 'Cadastrar Projeto'}
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
