import React, { useState } from 'react';
import { useSisgos } from '../context/SisgosContext';
import { formatCurrency } from '../utils/formatters';

export type ActiveTab =
  | 'gestao-os'
  | 'dashboard-analitico'
  | 'param-perfis'
  | 'param-projetos'
  | 'admin-der'
  | 'admin-ddl'
  | 'admin-dicionario'
  | 'admin-simulador'
  | 'admin-consultas'
  | 'admin-springboot';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { ordensServico, alocacoes, perfis, projetos, resetToInitialData, clearAllData } = useSisgos();

  // Dropdown states for click toggle
  const [isParamDropdownOpen, setIsParamDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Modal de confirmação interativo no lugar de window.confirm (bloqueado em iFrames)
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);

  // Total value of all OSs
  const valorTotalGeral = alocacoes.reduce((acc, curr) => acc + (curr.custo_alocacao || 0), 0);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsParamDropdownOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const executeResetData = () => {
    resetToInitialData();
    fetch('/api/v1/admin/reset-seed', { method: 'POST' }).catch(() => {});
    setConfirmAction(null);
    setFeedbackMsg({ text: 'Dados de demonstração (Seed) restaurados com sucesso!', type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const executeClearData = () => {
    clearAllData();
    fetch('/api/v1/admin/clear-data', { method: 'POST' }).catch(() => {});
    setConfirmAction(null);
    setFeedbackMsg({ text: 'Base de dados limpa com sucesso: todas as tabelas foram esvaziadas.', type: 'danger' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const isParamActive = activeTab === 'param-perfis' || activeTab === 'param-projetos';
  const isAdminActive = [
    'admin-der',
    'admin-ddl',
    'admin-dicionario',
    'admin-simulador',
    'admin-consultas',
    'admin-springboot',
  ].includes(activeTab);

  return (
    <header className="sticky-top shadow-sm z-3" style={{ borderBottom: '2px solid #0d6efd' }}>
      {/* 1. Main Navigation Bar (Dark Header with persistent buttons) */}
      <div className="bg-dark text-white py-2 px-3 px-md-4 border-bottom border-dark-subtle">
        <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-3 p-0">
          
          {/* Brand & Logo */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="d-flex align-items-center gap-2 border-0 bg-transparent text-start p-0 text-decoration-none"
              onClick={() => handleSelectTab('gestao-os')}
            >
              <div
                className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: 38, height: 38 }}
              >
                <i className="bi bi-stack fs-5"></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-5 tracking-tight text-white">SisGOS</span>
                  <span className="badge bg-primary px-2 py-1 fs-8">Full-Stack</span>
                </div>
                <small className="d-block text-white-50" style={{ fontSize: '11px', marginTop: '-2px' }}>
                  Ordens de Serviço & Equipes
                </small>
              </div>
            </button>
          </div>

          {/* 3 Main Groups: ALWAYS VISIBLE AS PILLS/TABS (Never hidden behind a hamburger) */}
          <div className="d-flex align-items-center flex-wrap gap-2">
            
            {/* GRUPO 1: Gestão de OSs */}
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-2 transition-all ${
                activeTab === 'gestao-os'
                  ? 'btn-primary text-white shadow'
                  : 'btn-outline-light border-secondary text-white'
              }`}
              onClick={() => handleSelectTab('gestao-os')}
            >
              <i className="bi bi-clipboard2-check-fill text-info"></i>
              <span>Gestão de OSs</span>
              <span className={`badge ${activeTab === 'gestao-os' ? 'bg-white text-primary' : 'bg-secondary'}`}>
                {ordensServico.length}
              </span>
            </button>

            {/* GRUPO NOVO: Dashboard Analítico */}
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-2 transition-all ${
                activeTab === 'dashboard-analitico'
                  ? 'btn-success text-white shadow'
                  : 'btn-outline-light border-secondary text-white'
              }`}
              onClick={() => handleSelectTab('dashboard-analitico')}
              title="Visualizar Dashboard Analítico, gráficos e indicadores de alocações"
            >
              <i className="bi bi-bar-chart-line-fill text-success-subtle"></i>
              <span>Dashboard Analítico</span>
              <span className={`badge ${activeTab === 'dashboard-analitico' ? 'bg-white text-success' : 'bg-secondary'}`}>
                BI
              </span>
            </button>

            {/* GRUPO 2: Parâmetros (CRUD) */}
            <div className="position-relative">
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-start-2 ${
                    isParamActive
                      ? 'btn-warning text-dark shadow fw-bold'
                      : 'btn-outline-light border-secondary text-white'
                  }`}
                  onClick={() => handleSelectTab('param-perfis')}
                  title="Abrir Módulo Parâmetros (Perfis Contratados e Projetos)"
                >
                  <i className="bi bi-sliders text-warning"></i>
                  <span>Parâmetros</span>
                  <span className={`badge ${isParamActive ? 'bg-dark text-warning' : 'bg-secondary'}`}>
                    CRUD
                  </span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm dropdown-toggle dropdown-toggle-split ${
                    isParamActive ? 'btn-warning text-dark' : 'btn-outline-light border-secondary text-white'
                  }`}
                  onClick={() => {
                    setIsParamDropdownOpen(!isParamDropdownOpen);
                    setIsAdminDropdownOpen(false);
                  }}
                  aria-label="Abrir submenus de Parâmetros"
                ></button>
              </div>

              {/* Dropdown Popup Menu */}
              {isParamDropdownOpen && (
                <div
                  className="dropdown-menu dropdown-menu-dark show shadow-lg border-secondary position-absolute mt-1"
                  style={{ minWidth: '240px', zIndex: 1050 }}
                >
                  <h6 className="dropdown-header text-uppercase text-warning small fw-bold">
                    Tabelas de Parâmetros (CRUD)
                  </h6>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'param-perfis' ? 'active bg-warning text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('param-perfis')}
                  >
                    <i className="bi bi-person-badge text-info fs-6"></i>
                    <div>
                      <div>Perfis Contratados</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>
                        Tabela: perfis_contratados ({perfis.length})
                      </small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'param-projetos' ? 'active bg-warning text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('param-projetos')}
                  >
                    <i className="bi bi-folder2 text-warning fs-6"></i>
                    <div>
                      <div>Projetos</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>
                        Tabela: projetos ({projetos.length})
                      </small>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* GRUPO 3: Administração & Backend */}
            <div className="position-relative">
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-start-2 ${
                    isAdminActive
                      ? 'btn-info text-dark shadow fw-bold'
                      : 'btn-outline-light border-secondary text-white'
                  }`}
                  onClick={() => handleSelectTab('admin-der')}
                  title="Abrir Módulo de Administração (DER, DDL, Dicionário, Simulador, Spring Boot)"
                >
                  <i className="bi bi-shield-lock-fill text-info"></i>
                  <span>Administração</span>
                  <span className={`badge ${isAdminActive ? 'bg-dark text-info' : 'bg-secondary'}`}>
                    6 Telas
                  </span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm dropdown-toggle dropdown-toggle-split ${
                    isAdminActive ? 'btn-info text-dark' : 'btn-outline-light border-secondary text-white'
                  }`}
                  onClick={() => {
                    setIsAdminDropdownOpen(!isAdminDropdownOpen);
                    setIsParamDropdownOpen(false);
                  }}
                  aria-label="Abrir submenus de Administração"
                ></button>
              </div>

              {/* Dropdown Popup Menu */}
              {isAdminDropdownOpen && (
                <div
                  className="dropdown-menu dropdown-menu-dark show shadow-lg border-secondary position-absolute mt-1"
                  style={{ minWidth: '270px', zIndex: 1050 }}
                >
                  <h6 className="dropdown-header text-uppercase text-info small fw-bold">
                    Modelagem, Banco & Backend
                  </h6>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'admin-der' ? 'active bg-info text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('admin-der')}
                  >
                    <i className="bi bi-diagram-3-fill text-info"></i>
                    <div>
                      <div>Diagrama DER</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>Modelo Entidade-Relacionamento</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'admin-ddl' ? 'active bg-info text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('admin-ddl')}
                  >
                    <i className="bi bi-code-slash text-warning"></i>
                    <div>
                      <div>Scripts DDL SQL</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>PostgreSQL, MySQL, SQLite</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'admin-dicionario' ? 'active bg-info text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('admin-dicionario')}
                  >
                    <i className="bi bi-journal-bookmark-fill text-success"></i>
                    <div>
                      <div>Dicionário de Dados</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>Metadados & Regras de Colunas</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'admin-simulador' ? 'active bg-info text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('admin-simulador')}
                  >
                    <i className="bi bi-cpu-fill text-danger"></i>
                    <div>
                      <div>Simulador de Regra & Trigger</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>Teste interativo da fórmula</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'admin-consultas' ? 'active bg-info text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('admin-consultas')}
                  >
                    <i className="bi bi-bar-chart-fill text-primary"></i>
                    <div>
                      <div>Consultas & Relatórios</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>Relatórios analíticos SQL</small>
                    </div>
                  </button>
                  <hr className="dropdown-divider border-secondary my-1" />
                  <button
                    type="button"
                    className={`dropdown-item py-2 d-flex align-items-center gap-2 ${
                      activeTab === 'admin-springboot' ? 'active bg-info text-dark fw-bold' : ''
                    }`}
                    onClick={() => handleSelectTab('admin-springboot')}
                  >
                    <i className="bi bi-cup-hot-fill text-warning"></i>
                    <div>
                      <div>API REST Spring Boot Java</div>
                      <small className="opacity-75" style={{ fontSize: '11px' }}>Controllers, Services & JPA</small>
                    </div>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right side: Global summary, Reset Seed and Limpar Dados */}
          <div className="d-flex align-items-center gap-2 ms-auto ms-lg-0">
            <div className="d-none d-lg-flex align-items-center gap-2 bg-dark-subtle px-3 py-1 rounded-pill border border-secondary text-light">
              <span className="badge bg-success rounded-circle p-1" style={{ width: 8, height: 8 }}></span>
              <span className="small text-white-50">Total OSs:</span>
              <strong className="text-white font-monospace small">
                {formatCurrency(valorTotalGeral)}
              </strong>
            </div>

            <div className="d-flex flex-column gap-1">
              <button
                type="button"
                id="btn-restaurar-seed"
                className="btn btn-outline-secondary btn-sm text-light d-flex align-items-center justify-content-center gap-1 py-1 px-2 border-secondary-subtle"
                style={{ fontSize: '11px', lineHeight: '1.2' }}
                title="Restaurar dados padrões de demonstração (Seed)"
                onClick={() => setConfirmAction('reset')}
              >
                <i className="bi bi-arrow-repeat text-info"></i>
                <span>Restaurar Seed</span>
              </button>

              <button
                type="button"
                id="btn-limpar-dados"
                className="btn btn-danger btn-sm d-flex align-items-center justify-content-center gap-1 py-1 px-2 shadow-sm"
                style={{ fontSize: '11px', lineHeight: '1.2' }}
                title="Excluir todos os dados da aplicação e restaurar a base de dados com as tabelas limpas"
                onClick={() => setConfirmAction('clear')}
              >
                <i className="bi bi-trash3"></i>
                <span className="fw-semibold">Limpar dados</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Confirmação Interativo (Substitui window.confirm bloqueado em iFrames) */}
      {confirmAction && (
        <div
          id="modal-confirmacao-dados"
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 9999 }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmAction(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
            <div className="modal-content border-0 shadow-lg overflow-hidden">
              {/* Modal Header */}
              <div
                className={`modal-header ${
                  confirmAction === 'clear' ? 'bg-danger text-white' : 'bg-primary text-white'
                } py-3 px-4`}
              >
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`bi ${
                      confirmAction === 'clear' ? 'bi-exclamation-triangle-fill fs-4' : 'bi-arrow-repeat fs-4'
                    }`}
                  ></i>
                  <h5 className="modal-title fw-bold mb-0 fs-5">
                    {confirmAction === 'clear'
                      ? 'Confirmação: Limpar Todos os Dados'
                      : 'Confirmação: Restaurar Dados Padrão (Seed)'}
                  </h5>
                </div>
                <button
                  type="button"
                  id="btn-modal-close-icon"
                  className="btn-close btn-close-white"
                  aria-label="Fechar"
                  onClick={() => setConfirmAction(null)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-white">
                {confirmAction === 'clear' ? (
                  <div>
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 py-2 px-3 border-danger-subtle bg-danger-subtle text-danger-emphasis">
                      <i className="bi bi-shield-slash-fill fs-5 text-danger flex-shrink-0"></i>
                      <div className="small fw-semibold">
                        Ação Destrutiva: todas as tabelas serão esvaziadas (0 registros).
                      </div>
                    </div>
                    <p className="text-dark mb-2">
                      Tem certeza de que deseja <strong>excluir todos os dados</strong> da aplicação e restaurar a base de
                      dados para a estrutura inicial limpa?
                    </p>
                    <div className="bg-light p-3 rounded border mb-3">
                      <div className="fw-semibold small text-secondary mb-1">Registros que serão excluídos:</div>
                      <ul className="text-muted small ps-3 mb-0">
                        <li>Todas as <strong>Ordens de Serviço</strong> cadastradas ({ordensServico.length} no total)</li>
                        <li>Todas as <strong>Alocações de Profissionais</strong> ({alocacoes.length} no total)</li>
                        <li>Todos os <strong>Perfis Contratados</strong> ({perfis.length} no total)</li>
                        <li>Todos os <strong>Projetos Governamentais</strong> ({projetos.length} no total)</li>
                      </ul>
                    </div>
                    <div className="text-muted small">
                      <i className="bi bi-info-circle me-1 text-primary"></i>
                      Após a limpeza, você poderá cadastrar novos registros manualmente ou restaurar a semente (Seed) a qualquer momento.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-primary d-flex align-items-center gap-2 mb-3 py-2 px-3 border-primary-subtle bg-primary-subtle text-primary-emphasis">
                      <i className="bi bi-arrow-repeat fs-5 text-primary flex-shrink-0"></i>
                      <div className="small fw-semibold">
                        Carga inicial de semente (Seed) com valores contratuais oficiais.
                      </div>
                    </div>
                    <p className="text-dark mb-2">
                      Deseja <strong>restaurar a base de dados</strong> para a semente inicial de demonstração (Seed)?
                    </p>
                    <div className="bg-light p-3 rounded border mb-3">
                      <div className="fw-semibold small text-secondary mb-1">Massa de dados que será restaurada:</div>
                      <ul className="text-muted small ps-3 mb-0">
                        <li><strong>4 Projetos</strong> (SGC-CORP, TRANS-SEFAZ, PEU-SAUDE, EDU-DIGITAL)</li>
                        <li><strong>10 Perfis Contratados</strong> com tabelas hora/mês</li>
                        <li><strong>4 Ordens de Serviço</strong> de exemplo e suas alocações de equipe</li>
                      </ul>
                    </div>
                    <div className="text-warning-emphasis bg-warning-subtle p-2 rounded border border-warning-subtle small">
                      <i className="bi bi-exclamation-triangle-fill me-1 text-warning"></i>
                      Todas as alterações manuais ou novos registros inseridos serão substituídos pela semente padrão.
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-end gap-2 border-top">
                <button
                  type="button"
                  id="btn-modal-cancelar"
                  className="btn btn-outline-secondary px-3"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancelar
                </button>
                {confirmAction === 'clear' ? (
                  <button
                    type="button"
                    id="btn-modal-confirmar-limpar"
                    className="btn btn-danger px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                    onClick={executeClearData}
                  >
                    <i className="bi bi-trash3"></i>
                    Sim, Limpar Tudo
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-modal-confirmar-restaurar"
                    className="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                    onClick={executeResetData}
                  >
                    <i className="bi bi-arrow-repeat"></i>
                    Sim, Restaurar Seed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificação Toast/Banner de ação de dados */}
      {feedbackMsg && (
        <div
          id="toast-dados-feedback"
          className={`alert ${feedbackMsg.type === 'danger' ? 'alert-danger bg-danger-subtle text-danger-emphasis' : 'alert-success bg-success-subtle text-success-emphasis'} py-1 px-3 mb-0 rounded-0 d-flex align-items-center justify-content-between border-bottom border-top-0 border-start-0 border-end-0 shadow-sm`}
          style={{ fontSize: '12px' }}
        >
          <div className="d-flex align-items-center gap-2 mx-auto">
            <i className={`bi ${feedbackMsg.type === 'danger' ? 'bi-trash3-fill text-danger' : 'bi-check-circle-fill text-success'}`}></i>
            <span className="fw-semibold">{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            className="btn-close btn-close-sm"
            style={{ fontSize: '9px' }}
            aria-label="Fechar"
            onClick={() => setFeedbackMsg(null)}
          ></button>
        </div>
      )}

      {/* 2. Sub-Navbar Bar: ALWAYS VISIBLE SUB-MENUS for easy 1-click navigation */}
      {isParamActive && (
        <div className="bg-warning-subtle text-dark border-bottom border-warning py-2 px-3 px-md-4">
          <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-2 p-0">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-warning text-dark border border-warning fw-bold px-2 py-1">
                <i className="bi bi-sliders me-1"></i>
                Grupo Parâmetros
              </span>
              <span className="small text-muted d-none d-md-inline">
                Tabelas de Apoio do Sistema com operações de CRUD completas:
              </span>
            </div>

            {/* Sub-menu tabs for Parâmetros */}
            <div className="nav nav-pills gap-1">
              <button
                type="button"
                className={`nav-link btn btn-sm py-1 px-3 d-flex align-items-center gap-2 fw-semibold rounded-pill ${
                  activeTab === 'param-perfis'
                    ? 'active bg-dark text-warning shadow-sm'
                    : 'bg-white text-dark border border-warning-subtle'
                }`}
                onClick={() => handleSelectTab('param-perfis')}
              >
                <i className="bi bi-person-badge"></i>
                <span>Perfis Contratados</span>
                <span className="badge bg-warning text-dark border border-dark-subtle">
                  {perfis.length}
                </span>
              </button>

              <button
                type="button"
                className={`nav-link btn btn-sm py-1 px-3 d-flex align-items-center gap-2 fw-semibold rounded-pill ${
                  activeTab === 'param-projetos'
                    ? 'active bg-dark text-warning shadow-sm'
                    : 'bg-white text-dark border border-warning-subtle'
                }`}
                onClick={() => handleSelectTab('param-projetos')}
              >
                <i className="bi bi-folder2"></i>
                <span>Projetos</span>
                <span className="badge bg-warning text-dark border border-dark-subtle">
                  {projetos.length}
                </span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none text-dark ms-2 small d-flex align-items-center gap-1"
                onClick={() => handleSelectTab('gestao-os')}
              >
                <i className="bi bi-arrow-left-circle"></i>
                <span>Voltar para OSs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdminActive && (
        <div className="bg-dark text-white border-bottom border-info-subtle py-2 px-3 px-md-4" style={{ backgroundColor: '#111827' }}>
          <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-2 p-0">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-info text-dark fw-bold px-2 py-1">
                <i className="bi bi-shield-lock-fill me-1"></i>
                Grupo Administração
              </span>
              <span className="small text-white-50 d-none d-lg-inline">
                Modelagem Relacional, Scripts DDL, Dicionário e Backend Spring Boot:
              </span>
            </div>

            {/* Sub-menu tabs for Administração */}
            <div className="d-flex flex-wrap gap-1 align-items-center">
              <button
                type="button"
                className={`btn btn-sm py-1 px-2 px-md-3 fw-semibold rounded-pill d-flex align-items-center gap-1 ${
                  activeTab === 'admin-der'
                    ? 'btn-info text-dark shadow-sm'
                    : 'btn-outline-secondary text-white'
                }`}
                onClick={() => handleSelectTab('admin-der')}
              >
                <i className="bi bi-diagram-3-fill"></i>
                <span>DER</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm py-1 px-2 px-md-3 fw-semibold rounded-pill d-flex align-items-center gap-1 ${
                  activeTab === 'admin-ddl'
                    ? 'btn-info text-dark shadow-sm'
                    : 'btn-outline-secondary text-white'
                }`}
                onClick={() => handleSelectTab('admin-ddl')}
              >
                <i className="bi bi-code-slash"></i>
                <span>DDL SQL</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm py-1 px-2 px-md-3 fw-semibold rounded-pill d-flex align-items-center gap-1 ${
                  activeTab === 'admin-dicionario'
                    ? 'btn-info text-dark shadow-sm'
                    : 'btn-outline-secondary text-white'
                }`}
                onClick={() => handleSelectTab('admin-dicionario')}
              >
                <i className="bi bi-journal-bookmark-fill"></i>
                <span>Dicionário</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm py-1 px-2 px-md-3 fw-semibold rounded-pill d-flex align-items-center gap-1 ${
                  activeTab === 'admin-simulador'
                    ? 'btn-info text-dark shadow-sm'
                    : 'btn-outline-secondary text-white'
                }`}
                onClick={() => handleSelectTab('admin-simulador')}
              >
                <i className="bi bi-cpu-fill"></i>
                <span>Simulador</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm py-1 px-2 px-md-3 fw-semibold rounded-pill d-flex align-items-center gap-1 ${
                  activeTab === 'admin-consultas'
                    ? 'btn-info text-dark shadow-sm'
                    : 'btn-outline-secondary text-white'
                }`}
                onClick={() => handleSelectTab('admin-consultas')}
              >
                <i className="bi bi-bar-chart-fill"></i>
                <span>Consultas</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm py-1 px-2 px-md-3 fw-semibold rounded-pill d-flex align-items-center gap-1 ${
                  activeTab === 'admin-springboot'
                    ? 'btn-warning text-dark shadow-sm fw-bold'
                    : 'btn-outline-warning text-warning'
                }`}
                onClick={() => handleSelectTab('admin-springboot')}
              >
                <i className="bi bi-cup-hot-fill"></i>
                <span>Spring Boot (Java)</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none text-white-50 ms-2 small d-flex align-items-center gap-1"
                onClick={() => handleSelectTab('gestao-os')}
              >
                <i className="bi bi-arrow-left-circle"></i>
                <span>Voltar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
