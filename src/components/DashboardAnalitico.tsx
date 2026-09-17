import React, { useState } from 'react';
import { ActiveTab } from './Navbar';
import { DashboardHub, ModuloAnalitico } from './dashboard/DashboardHub';
import { ModuloProjetosUnidades } from './dashboard/ModuloProjetosUnidades';
import { ModuloAlocacoesCustos } from './dashboard/ModuloAlocacoesCustos';
import { ModuloPerfisContratados } from './dashboard/ModuloPerfisContratados';

interface DashboardAnaliticoProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const DashboardAnalitico: React.FC<DashboardAnaliticoProps> = ({ onNavigate }) => {
  const [activeModulo, setActiveModulo] = useState<ModuloAnalitico>('hub');

  return (
    <div>
      {/* Barra de Navegação Rápida entre Módulos (quando não estiver no Hub) */}
      {activeModulo !== 'hub' && (
        <div className="bg-white border-bottom shadow-sm px-4 py-2 sticky-top" style={{ zIndex: 1020 }}>
          <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => setActiveModulo('hub')}
                title="Voltar para a página inicial com todos os módulos"
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
                <span className="d-none d-sm-inline">Visão Geral dos Módulos</span>
                <span className="d-inline d-sm-none">Hub</span>
              </button>
              <div className="vr d-none d-md-block my-1"></div>
              <span className="text-muted small fw-semibold d-none d-md-inline">
                Alternar Módulo:
              </span>
            </div>

            <div className="nav nav-pills nav-fill gap-1" role="tablist">
              {/* Módulo 1 */}
              <button
                type="button"
                className={`btn btn-sm ${
                  activeModulo === 'projetos-unidades'
                    ? 'btn-primary fw-bold shadow-sm'
                    : 'btn-light border text-secondary'
                } d-flex align-items-center gap-1 px-3`}
                onClick={() => setActiveModulo('projetos-unidades')}
              >
                <i className="bi bi-diagram-3-fill"></i>
                <span>Projetos & Unidades</span>
              </button>

              {/* Módulo 2 */}
              <button
                type="button"
                className={`btn btn-sm ${
                  activeModulo === 'alocacoes-custos'
                    ? 'btn-success fw-bold shadow-sm'
                    : 'btn-light border text-secondary'
                } d-flex align-items-center gap-1 px-3`}
                onClick={() => setActiveModulo('alocacoes-custos')}
              >
                <i className="bi bi-cash-coin"></i>
                <span>Alocações & Custos</span>
              </button>

              {/* Módulo 3 */}
              <button
                type="button"
                className={`btn btn-sm ${
                  activeModulo === 'perfis-contratados'
                    ? 'btn-info text-white fw-bold shadow-sm'
                    : 'btn-light border text-secondary'
                } d-flex align-items-center gap-1 px-3`}
                onClick={() => setActiveModulo('perfis-contratados')}
              >
                <i className="bi bi-person-badge-fill"></i>
                <span>Perfis Contratados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderização Condicional dos Módulos */}
      {activeModulo === 'hub' && (
        <DashboardHub onSelectModulo={(modulo) => setActiveModulo(modulo)} />
      )}

      {activeModulo === 'projetos-unidades' && (
        <ModuloProjetosUnidades onVoltarHub={() => setActiveModulo('hub')} />
      )}

      {activeModulo === 'alocacoes-custos' && (
        <ModuloAlocacoesCustos
          onVoltarHub={() => setActiveModulo('hub')}
          onNavigate={onNavigate}
        />
      )}

      {activeModulo === 'perfis-contratados' && (
        <ModuloPerfisContratados onVoltarHub={() => setActiveModulo('hub')} />
      )}
    </div>
  );
};
