import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface OpcaoFiltro {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  count?: number;
}

interface FiltroMultiplaSelecaoProps {
  label?: string;
  titulo?: string;
  opcoes: OpcaoFiltro[];
  selecionados: string[]; // array vazio = "todos" selecionados (sem filtro restritivo)
  onChange?: (novosSelecionados: string[]) => void;
  onSelectionChange?: (novosSelecionados: string[]) => void;
  placeholder?: string;
  icone?: string;
  badgeColor?: string;
  className?: string;
}

export const FiltroMultiplaSelecao: React.FC<FiltroMultiplaSelecaoProps> = ({
  label,
  titulo,
  opcoes,
  selecionados = [],
  onChange,
  onSelectionChange,
  placeholder = 'Todos',
  icone = 'bi-funnel',
  badgeColor = 'primary',
  className = '',
}) => {
  const labelTexto = titulo || label || '';
  const [isOpen, setIsOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Dispara a atualização através de onChange ou onSelectionChange com segurança
  const notificarMudanca = (novos: string[]) => {
    if (typeof onChange === 'function') {
      onChange(novos);
    }
    if (typeof onSelectionChange === 'function') {
      onSelectionChange(novos);
    }
  };

  // Fecha o dropdown ao clicar fora ou ao pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!target || !document.contains(target)) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
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

  // Se selecionados possui restrições ativas
  const isFiltrado = selecionados.length > 0;

  // Toggle direto de cada opção:
  // Se já está selecionado -> remove.
  // Se não está selecionado -> adiciona.
  // Elimina qualquer comportamento ambíguo e responde em 1 único clique no Google Chrome
  const handleToggleOpcao = (value: string) => {
    let novo: string[];
    if (selecionados.includes(value)) {
      novo = selecionados.filter((v) => v !== value);
    } else {
      novo = [...selecionados, value];
    }
    notificarMudanca(novo);
  };

  // Seleciona todas as opções
  const handleSelecionarTodos = () => {
    const todas = opcoes.map((op) => op.value);
    notificarMudanca(todas);
  };

  // Limpa o filtro (volta ao estado "sem filtro" / todos ativos)
  const handleLimparSelecao = () => {
    notificarMudanca([]);
  };

  // Texto do botão gatilho
  const textoBotao = useMemo(() => {
    if (!isFiltrado) {
      return `${placeholder} (${opcoes.length})`;
    }
    if (selecionados.length === 1) {
      const encontrada = opcoes.find((o) => o.value === selecionados[0]);
      return encontrada ? encontrada.label : selecionados[0];
    }
    if (selecionados.length === opcoes.length && opcoes.length > 0) {
      return `Todos selecionados (${opcoes.length})`;
    }
    return `${selecionados.length} selecionado(s)`;
  }, [isFiltrado, selecionados, opcoes, placeholder]);

  return (
    <div className={`position-relative ${className}`} ref={containerRef}>
      <label className="form-label small fw-bold text-secondary mb-1 d-flex justify-content-between align-items-center">
        <span>
          <i className={`bi ${icone} me-1 text-${badgeColor}`}></i>
          {labelTexto}
        </span>
        {isFiltrado && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none text-danger fw-normal"
            style={{ fontSize: '11px' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLimparSelecao();
            }}
            title="Limpar seleção deste filtro"
          >
            <i className="bi bi-x-circle me-1"></i>Limpar
          </button>
        )}
      </label>

      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        className={`form-select form-select-sm text-start d-flex justify-content-between align-items-center shadow-none ${
          isFiltrado
            ? `border-${badgeColor} bg-${badgeColor}-subtle text-${badgeColor} fw-semibold`
            : 'bg-white text-secondary'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-truncate me-2" style={{ maxWidth: '85%' }}>
          {textoBotao}
        </span>
        {isFiltrado ? (
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
          {opcoes.length > 4 && (
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
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {busca && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBusca('');
                  }}
                  title="Limpar pesquisa"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          )}

          {/* Ações de atalho: Todos / Limpar */}
          <div className="d-flex justify-content-between align-items-center px-1 pb-2 mb-2 border-bottom">
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-primary py-0 px-2 fw-semibold"
                style={{ fontSize: '11px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelecionarTodos();
                }}
                title="Selecionar todas as opções disponíveis"
              >
                <i className="bi bi-check-all me-1"></i>Todos
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary py-0 px-2 fw-semibold"
                style={{ fontSize: '11px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLimparSelecao();
                }}
                title="Limpar seleção (remover filtros)"
              >
                <i className="bi bi-x-circle me-1"></i>Limpar
              </button>
            </div>
            <span className="text-muted" style={{ fontSize: '11px' }}>
              {!isFiltrado ? (
                <span className="badge bg-secondary-subtle text-secondary fw-normal">Todos ativos</span>
              ) : (
                <span className={`badge bg-${badgeColor} text-white fw-medium`}>
                  {selecionados.length} de {opcoes.length}
                </span>
              )}
            </span>
          </div>

          {/* Lista de Opções com Checkboxes */}
          <div
            className="overflow-auto pe-1"
            style={{ maxHeight: '230px' }}
          >
            {opcoesFiltradas.length === 0 ? (
              <div className="text-muted text-center py-3 small">
                Nenhum item encontrado para "{busca}"
              </div>
            ) : (
              opcoesFiltradas.map((op) => {
                const isChecked = selecionados.includes(op.value);
                return (
                  <div
                    key={op.value}
                    className={`py-1 px-2 rounded-2 d-flex align-items-center justify-content-between mb-1 ${
                      isChecked
                        ? `bg-${badgeColor}-subtle border border-${badgeColor}-subtle`
                        : 'hover-bg-light border border-transparent'
                    }`}
                    style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.15s ease' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleOpcao(op.value);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleOpcao(op.value);
                      }
                    }}
                  >
                    <div className="d-flex align-items-center text-truncate me-2" style={{ pointerEvents: 'none' }}>
                      <input
                        className="form-check-input me-2 mt-0"
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        tabIndex={-1}
                        style={{ pointerEvents: 'none', cursor: 'pointer' }}
                      />
                      <span className="small text-truncate mb-0">
                        <span className={`fw-medium ${isChecked ? `text-${badgeColor} fw-semibold` : 'text-dark'}`}>
                          {op.label}
                        </span>
                        {op.sublabel && (
                          <span className="text-muted ms-1 small">({op.sublabel})</span>
                        )}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-1" style={{ pointerEvents: 'none' }}>
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
              <i className="bi bi-info-circle me-1"></i>Clique para alternar
            </small>
            <button
              type="button"
              className="btn btn-sm btn-primary py-0 px-3 fw-semibold"
              style={{ fontSize: '12px' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
