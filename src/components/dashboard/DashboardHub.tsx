import React from 'react';
import { useSisgos } from '../../context/SisgosContext';
import { formatCurrency } from '../../utils/formatters';

export type ModuloAnalitico = 'hub' | 'projetos-unidades' | 'alocacoes-custos' | 'perfis-contratados';

interface DashboardHubProps {
  onSelectModulo: (modulo: ModuloAnalitico) => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({ onSelectModulo }) => {
  const { ordensServico, projetos, perfis, alocacoes } = useSisgos();

  // 1. Módulo Projetos & Unidades - Cálculos
  const qtdProjetos = projetos.length;
  const qtdSecretarias = new Set(projetos.map((p) => p.sigla_secretaria.trim().toUpperCase())).size;
  const totalCustoGeral = alocacoes.reduce((acc, a) => acc + (a.custo_alocacao || 0), 0);
  const custoMedioOssProjetos = ordensServico.length > 0 ? totalCustoGeral / ordensServico.length : 0;

  // 2. Módulo Alocações & Custos - Cálculos
  const qtdTotalOss = ordensServico.length;
  const valorTotalConsolidado = totalCustoGeral;
  const totalProfissionaisAlocadosNasOss = alocacoes.length; // total de designações/alocações

  // 3. Módulo Perfis Contratados - Cálculos
  const nomesProfissionaisUnicos = new Set(
    alocacoes.map((a) => a.nome_profissional?.trim().toLowerCase()).filter(Boolean)
  );
  const qtdProfissionais = nomesProfissionaisUnicos.size;
  const qtdPerfis = perfis.length;
  const custoMensalTotalPerfis = perfis.reduce((acc, p) => acc + (p.custo_mensal_perfil || 0), 0);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header do Hub */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary text-white px-2 py-1 fw-bold">
              <i className="bi bi-grid-3x3-gap-fill me-1"></i>
              Portal de BI & Inteligência
            </span>
            <span className="badge bg-light text-dark border">Versão Modular</span>
            <span className="text-muted small">SISGOS Analytics</span>
          </div>
          <h2 className="fw-bold text-dark mb-1">Dashboard Analítico — Módulos Estratégicos</h2>
          <p className="text-muted mb-0 small" style={{ maxWidth: '850px' }}>
            Selecione um dos módulos analíticos abaixo para explorar visualizações avançadas, indicadores de desempenho,
            distribuição orçamentária e cruzamento de dados de ordens de serviço, projetos e equipes.
          </p>
        </div>
      </div>

      {/* Grid com os Cards dos 3 Módulos Analíticos */}
      <div className="row g-4 mb-4">
        {/* ============================================================== */}
        {/* CARD 1: MÓDULO PROJETOS & UNIDADES */}
        {/* ============================================================== */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 bg-white d-flex flex-column transition-all hover-shadow">
            <div className="card-header bg-white pt-4 pb-3 px-4 border-bottom">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                    <i className="bi bi-diagram-3-fill fs-4"></i>
                  </div>
                  <div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle small mb-1">
                      Módulo 1
                    </span>
                    <h4 className="fw-bold text-dark mb-0 fs-5">Projetos & Unidades</h4>
                  </div>
                </div>
                <span className="badge bg-light text-secondary border">Demandas & Órgãos</span>
              </div>
              <p className="text-muted small mb-0 mt-2">
                Visão analítica dos projetos corporativos e secretarias atendidas, consolidando volume de OSs,
                alocação de equipes e custos totais por demandante.
              </p>
            </div>

            <div className="card-body px-4 py-3 flex-grow-1">
              {/* Indicadores de Destaque */}
              <div className="mb-3">
                <span className="text-xs fw-bold text-uppercase text-secondary tracking-wider d-block mb-2">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  Indicadores de Destaque
                </span>

                <div className="vstack gap-2">
                  {/* Indicador 1: Quantidade de Projetos */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Quantidade de Projetos:</span>
                    <span className="fw-bold text-dark fs-6">{qtdProjetos} projetos</span>
                  </div>

                  {/* Indicador 2: Quantidade de Secretarias */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Quantidade de Secretarias:</span>
                    <span className="fw-bold text-dark fs-6">{qtdSecretarias} secretarias</span>
                  </div>

                  {/* Indicador 3: Custo Médio das OSs Mensais dos Projetos */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Custo Médio das OSs Mensais:</span>
                    <span className="fw-bold text-primary fs-6 font-monospace">
                      {formatCurrency(custoMedioOssProjetos)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtros Aplicáveis */}
              <div>
                <span className="text-xs fw-bold text-uppercase text-secondary tracking-wider d-block mb-2">
                  <i className="bi bi-funnel me-1"></i>
                  Filtros Aplicáveis
                </span>
                <div className="d-flex flex-wrap gap-1">
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Secretaria / Órgão
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Projeto / Unidade
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Ano de Exercício
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Situação SGC & Passivo
                  </span>
                </div>
              </div>
            </div>

            <div className="card-footer bg-white p-4 pt-0 border-0">
              <button
                type="button"
                className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={() => onSelectModulo('projetos-unidades')}
              >
                <span>Acessar Projetos & Unidades</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 2: MÓDULO ALOCAÇÕES & CUSTOS */}
        {/* ============================================================== */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 bg-white d-flex flex-column transition-all hover-shadow">
            <div className="card-header bg-white pt-4 pb-3 px-4 border-bottom">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-success-subtle text-success">
                    <i className="bi bi-cash-coin fs-4"></i>
                  </div>
                  <div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle small mb-1">
                      Módulo 2
                    </span>
                    <h4 className="fw-bold text-dark mb-0 fs-5">Alocações & Custos</h4>
                  </div>
                </div>
                <span className="badge bg-light text-secondary border">Execução Financeira</span>
              </div>
              <p className="text-muted small mb-0 mt-2">
                Consolidação financeira detalhada das Ordens de Serviço, despesas mensais por perfil profissional,
                notas de empenho e processo SEI de pagamento.
              </p>
            </div>

            <div className="card-body px-4 py-3 flex-grow-1">
              {/* Indicadores de Destaque */}
              <div className="mb-3">
                <span className="text-xs fw-bold text-uppercase text-secondary tracking-wider d-block mb-2">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  Indicadores de Destaque
                </span>

                <div className="vstack gap-2">
                  {/* Indicador 1: Quantidade total de OSs */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Quantidade Total de OSs:</span>
                    <span className="fw-bold text-dark fs-6">{qtdTotalOss} ordens</span>
                  </div>

                  {/* Indicador 2: Valor Total Consolidado */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Valor Total Consolidado:</span>
                    <span className="fw-bold text-success fs-6 font-monospace">
                      {formatCurrency(valorTotalConsolidado)}
                    </span>
                  </div>

                  {/* Indicador 3: Total de profissionais alocados nas OSs */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Total de Alocados nas OSs:</span>
                    <span className="fw-bold text-dark fs-6">{totalProfissionaisAlocadosNasOss} alocações</span>
                  </div>
                </div>
              </div>

              {/* Filtros Aplicáveis */}
              <div>
                <span className="text-xs fw-bold text-uppercase text-secondary tracking-wider d-block mb-2">
                  <i className="bi bi-funnel me-1"></i>
                  Filtros Aplicáveis
                </span>
                <div className="d-flex flex-wrap gap-1">
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Número da OS
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Projeto / Unidade
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Ano & Mês de Referência
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Perfil Contratado
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    NE & Processo SEI
                  </span>
                </div>
              </div>
            </div>

            <div className="card-footer bg-white p-4 pt-0 border-0">
              <button
                type="button"
                className="btn btn-success w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={() => onSelectModulo('alocacoes-custos')}
              >
                <span>Acessar Alocações & Custos</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 3: MÓDULO PERFIS CONTRATADOS */}
        {/* ============================================================== */}
        <div className="col-12 col-lg-4">
          <div className="card h-100 border-0 shadow-sm rounded-3 bg-white d-flex flex-column transition-all hover-shadow">
            <div className="card-header bg-white pt-4 pb-3 px-4 border-bottom">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-info-subtle text-info">
                    <i className="bi bi-person-badge-fill fs-4"></i>
                  </div>
                  <div>
                    <span className="badge bg-info-subtle text-info border border-info-subtle small mb-1">
                      Módulo 3
                    </span>
                    <h4 className="fw-bold text-dark mb-0 fs-5">Perfis Contratados</h4>
                  </div>
                </div>
                <span className="badge bg-light text-secondary border">RH & Especialidades</span>
              </div>
              <p className="text-muted small mb-0 mt-2">
                Análise cruzada dos perfis contratados, alocação mensal dos profissionais nos projetos e acompanhamento
                da taxa total de dedicação individual por mês.
              </p>
            </div>

            <div className="card-body px-4 py-3 flex-grow-1">
              {/* Indicadores de Destaque */}
              <div className="mb-3">
                <span className="text-xs fw-bold text-uppercase text-secondary tracking-wider d-block mb-2">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  Indicadores de Destaque
                </span>

                <div className="vstack gap-2">
                  {/* Indicador 1: Quantidade de Profissionais */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Quantidade de Profissionais:</span>
                    <span className="fw-bold text-dark fs-6">{qtdProfissionais} profissionais</span>
                  </div>

                  {/* Indicador 2: Quantidade de Perfis */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Quantidade de Perfis:</span>
                    <span className="fw-bold text-dark fs-6">{qtdPerfis} perfis</span>
                  </div>

                  {/* Indicador 3: Custo Mensal total dos Perfis */}
                  <div className="p-2 rounded-2 bg-light border border-light-subtle d-flex justify-content-between align-items-center">
                    <span className="small text-muted fw-medium">Custo Mensal Total dos Perfis:</span>
                    <span className="fw-bold text-info fs-6 font-monospace">
                      {formatCurrency(custoMensalTotalPerfis)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtros Aplicáveis */}
              <div>
                <span className="text-xs fw-bold text-uppercase text-secondary tracking-wider d-block mb-2">
                  <i className="bi bi-funnel me-1"></i>
                  Filtros Aplicáveis
                </span>
                <div className="d-flex flex-wrap gap-1">
                  <span className="badge bg-primary text-white">
                    Nome do Profissional (Chave)
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Perfil Contratado
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Mês de Referência
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Projeto / Unidade
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                    Secretaria
                  </span>
                </div>
              </div>
            </div>

            <div className="card-footer bg-white p-4 pt-0 border-0">
              <button
                type="button"
                className="btn btn-info text-white w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={() => onSelectModulo('perfis-contratados')}
              >
                <span>Acessar Perfis Contratados</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Integrado das Fontes de Dados */}
      <div className="card border-0 shadow-sm bg-white p-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-8">
            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-database-check text-success"></i>
              Base de Dados Integrada em Tempo Real
            </h5>
            <p className="text-muted small mb-0">
              Todos os módulos analíticos compartilham a mesma base relacional do SISGOS ({projetos.length} projetos, {ordensServico.length} ordens de serviço, {perfis.length} perfis de catálogo e {alocacoes.length} alocações ativas). Qualquer alteração de dados reflete instantaneamente nos três módulos.
            </p>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <span className="badge bg-light text-secondary border px-3 py-2">
              <i className="bi bi-shield-check text-success me-1"></i>
              Regra de Snapshot de Custo Garantida
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
