import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface OpcaoFiltro {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  count?: number;
}

interface FiltroMultiplaSelecaoProps {
  label: string;
  opcoes: OpcaoFiltro[];
  selecionados: string[]; // array vazio = "todos" selecionados
  onChange: (novosSelecionados: string[]) => void;
  placeholder?: string;
  icone?: string;
  badgeColor?: string;
  className?: string;
}

export const FiltroMultiplaSelecao: React.FC<FiltroMultiplaSelecaoProps> = ({
  label,
  opcoes,
  selecionados,
  onChange,
  placeholder = 'Todos',
  icone = 'bi-funnel',
  badgeColor = 'primary',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Opções filtradas pela busca interna
  const opcoesFiltradas = useMemo(() => {
    if (!busca.trim()) return opcoes;
    const term = busca.toLowerCase().trim();
    return opcoes.filter(
      (op) =>
        op.label.toLowerCase().includes(term) ||
        op.value.toLowerCase().includes(term) ||
        (op.sublabel && op.sublabel.toLowerCase().includes(term))
    );
  }, [opcoes, busca]);

  // Se selecionados está vazio, todos estão ativos
  const todosSelecionados = selecionados.length === 0;

  const handleToggleOpcao = (value: string) => {
    if (todosSelecionados) {
      // Se todos estavam ativos e o usuário clicou em um específico,
      // ele quer selecionar apenas todos os outros exceto este? Ou quer isolar este?
      // O padrão mais amigável de multi-select: clicar com "todos" seleciona apenas aquele item
      onChange([value]);
    } else {
      if (selecionados.includes(value)) {
        const novo = selecionados.filter((v) => v !== value);
        onChange(novo); // se ficar vazio, volta a significar "todos"
      } else {
        const novo = [...selecionados, value];
        // Se agora selecionou todas as opções possíveis, volta para array vazio (representando "todos")
        if (novo.length === opcoes.length) {
          onChange([]);
        } else {
          onChange(novo);
        }
      }
    }
  };

  const handleSelecionarTodos = () => {
    onChange([]); // vazio representa "todos"
  };

  const handleLimparSelecao = () => {
    // Para limpar tudo ou selecionar o primeiro?
    // Em filtros, "limpar" normalmente significa desmarcar restrições (selecionar todos)
    // ou se quiser nenhum:
    onChange([]);
  };

  // Texto do botão gatilho
  const textoBotao = useMemo(() => {
    if (todosSelecionados) {
      return `${placeholder} (${opcoes.length})`;
    }
    if (selecionados.length === 1) {
      const encontrada = opcoes.find((o) => o.value === selecionados[0]);
      return encontrada ? encontrada.label : selecionados[0];
    }
    return `${selecionados.length} selecionado(s)`;
  }, [todosSelecionados, selecionados, opcoes, placeholder]);

  return (
    <div className={`position-relative ${className}`} ref={containerRef}>
      <label className="form-label small fw-bold text-secondary mb-1 d-flex justify-content-between align-items-center">
        <span>
          <i className={`bi ${icone} me-1 text-${badgeColor}`}></i>
          {label}
        </span>
        {!todosSelecionados && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
            style={{ fontSize: '11px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelecionarTodos();
            }}
            title="Redefinir para todos"
          >
            <i className="bi bi-x-circle me-1"></i>Limpar
          </button>
        )}
      </label>

      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        className={`form-select form-select-sm text-start d-flex justify-content-between align-items-center shadow-none ${
          !todosSelecionados ? `border-${badgeColor} bg-${badgeColor}-subtle fw-semibold` : 'bg-white'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-truncate me-2" style={{ maxWidth: '85%' }}>
          {textoBotao}
        </span>
        {!todosSelecionados ? (
          <span className={`badge bg-${badgeColor} rounded-pill text-white ms-1`} style={{ fontSize: '10px' }}>
            {selecionados.length}
          </span>
        ) : (
          <span className="text-muted small">▼</span>
        )}
      </button>

      {/* Painel Dropdown Flutuante */}
      {isOpen && (
        <div
          className="position-absolute bg-white rounded-3 shadow-lg border p-2 mt-1 z-3"
          style={{
            minWidth: '260px',
            maxWidth: '360px',
            width: '100%',
            top: '100%',
            left: 0,
            zIndex: 1060,
          }}
        >
          {/* Barra de Busca rápida interna */}
          {opcoes.length > 5 && (
            <div className="input-group input-group-sm mb-2">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Pesquisar opções..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
              />
              {busca && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setBusca('')}
                  title="Limpar pesquisa"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          )}

          {/* Ações de atalho: Todos / Limpar */}
          <div className="d-flex justify-content-between align-items-center px-1 pb-2 mb-1 border-bottom">
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
              style={{ fontSize: '12px' }}
              onClick={handleSelecionarTodos}
            >
              <i className="bi bi-check-all me-1"></i>Selecionar Todos
            </button>
            <span className="text-muted" style={{ fontSize: '11px' }}>
              {todosSelecionados ? `${opcoes.length} de ${opcoes.length}` : `${selecionados.length} de ${opcoes.length}`}
            </span>
          </div>

          {/* Lista de Opções com Checkboxes */}
          <div
            className="overflow-auto pe-1"
            style={{ maxHeight: '220px' }}
          >
            {opcoesFiltradas.length === 0 ? (
              <div className="text-muted text-center py-3 small">
                Nenhum item encontrado para "{busca}"
              </div>
            ) : (
              opcoesFiltradas.map((op) => {
                const isChecked = todosSelecionados || selecionados.includes(op.value);
                return (
                  <div
                    key={op.value}
                    className={`form-check py-1 px-2 rounded-2 d-flex align-items-center justify-content-between cursor-pointer ${
                      isChecked && !todosSelecionados ? `bg-${badgeColor}-subtle` : 'hover-bg-light'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleOpcao(op.value)}
                  >
                    <div className="d-flex align-items-center text-truncate me-2">
                      <input
                        className="form-check-input me-2 mt-0 cursor-pointer"
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // tratado no onClick do container
                        id={`chk-${label}-${op.value}`}
                      />
                      <label
                        className="form-check-label small cursor-pointer text-truncate mb-0"
                        htmlFor={`chk-${label}-${op.value}`}
                        title={op.label}
                      >
                        <span className="fw-medium text-dark">{op.label}</span>
                        {op.sublabel && (
                          <span className="text-muted ms-1 small">({op.sublabel})</span>
                        )}
                      </label>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      {op.badge && (
                        <span className="badge bg-light text-secondary border" style={{ fontSize: '10px' }}>
                          {op.badge}
                        </span>
                      )}
                      {op.count !== undefined && (
                        <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '10px' }}>
                          {op.count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé do Dropdown */}
          <div className="pt-2 mt-1 border-top d-flex justify-content-between align-items-center">
            <small className="text-muted" style={{ fontSize: '11px' }}>
              <i className="bi bi-info-circle me-1"></i>Múltipla seleção ativa
            </small>
            <button
              type="button"
              className="btn btn-sm btn-primary py-0 px-2 fw-semibold"
              style={{ fontSize: '12px' }}
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
