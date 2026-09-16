import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Projeto, PerfilContratado, OrdemServico, AlocacaoPerfilOs, MesReferencia } from '../types/models';
import { INITIAL_PROJETOS, INITIAL_PERFIS, INITIAL_ORDENS_SERVICO, INITIAL_ALOCACOES } from '../data/initialData';
import { apiService } from '../services/api';

interface SisgosContextType {
  projetos: Projeto[];
  perfis: PerfilContratado[];
  ordensServico: OrdemServico[];
  alocacoes: AlocacaoPerfilOs[];
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  refreshData: () => Promise<void>;
  
  // Projetos CRUD
  addProjeto: (p: Omit<Projeto, 'id' | 'criado_em'>) => Projeto;
  updateProjeto: (id: number, p: Partial<Projeto>) => void;
  deleteProjeto: (id: number) => { success: boolean; message?: string };

  // Perfis CRUD
  addPerfil: (p: Omit<PerfilContratado, 'id' | 'criado_em'>) => PerfilContratado;
  updatePerfil: (id: number, p: Partial<PerfilContratado>) => void;
  deletePerfil: (id: number) => { success: boolean; message?: string };
  toggleVigenciaPerfil: (id: number) => void;

  // OS CRUD
  addOrdemServico: (os: Omit<OrdemServico, 'id' | 'criado_em'>) => OrdemServico;
  updateOrdemServico: (id: number, os: Partial<OrdemServico>) => void;
  deleteOrdemServico: (id: number) => void;

  // Alocações (N:N)
  getAlocacoesByOs: (osId: number) => AlocacaoPerfilOs[];
  addAlocacao: (params: {
    ordem_servico_id: number;
    perfil_contratado_id: number;
    mes_referencia: MesReferencia;
    nome_profissional: string;
    percentual_alocacao: number;
  }) => AlocacaoPerfilOs;
  updateAlocacao: (
    id: number,
    params: {
      perfil_contratado_id: number;
      mes_referencia: MesReferencia;
      nome_profissional: string;
      percentual_alocacao: number;
    }
  ) => void;
  deleteAlocacao: (id: number) => void;

  // Regras de Negócio & Cálculos
  getCalculoValorTotalOS: (osId: number) => number;
  getNomesProfissionaisDistintos: () => string[];
  resetToInitialData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const SisgosContext = createContext<SisgosContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJETOS: 'sisgos_projetos_v2',
  PERFIS: 'sisgos_perfis_v2',
  ORDENS: 'sisgos_ordens_v2',
  ALOCACOES: 'sisgos_alocacoes_v2',
  LAST_SYNC: 'sisgos_last_sync_v2',
};

export const SisgosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projetos, setProjetos] = useState<Projeto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJETOS);
      return saved ? JSON.parse(saved) : INITIAL_PROJETOS;
    } catch {
      return INITIAL_PROJETOS;
    }
  });

  const [perfis, setPerfis] = useState<PerfilContratado[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERFIS);
      return saved ? JSON.parse(saved) : INITIAL_PERFIS;
    } catch {
      return INITIAL_PERFIS;
    }
  });

  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDENS);
      return saved ? JSON.parse(saved) : INITIAL_ORDENS_SERVICO;
    } catch {
      return INITIAL_ORDENS_SERVICO;
    }
  });

  const [alocacoes, setAlocacoes] = useState<AlocacaoPerfilOs[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALOCACOES);
      return saved ? JSON.parse(saved) : INITIAL_ALOCACOES;
    } catch {
      return INITIAL_ALOCACOES;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });

  // Salvar no localStorage como cache offline secundário
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify(projetos));
  }, [projetos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify(perfis));
  }, [perfis]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(ordensServico));
  }, [ordensServico]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALOCACOES, JSON.stringify(alocacoes));
  }, [alocacoes]);

  // Sincronização direta com a base de dados (GET em todas as tabelas)
  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const [loadedPerfis, loadedProjetos, loadedDetalhadas] = await Promise.all([
        apiService.getPerfis().catch(err => {
          console.warn('[SisGOS] Aviso ao carregar perfis do banco:', err);
          return null;
        }),
        apiService.getProjetos().catch(err => {
          console.warn('[SisGOS] Aviso ao carregar projetos do banco:', err);
          return null;
        }),
        apiService.getOrdensServicoDetalhadas().catch(err => {
          console.warn('[SisGOS] Aviso ao carregar ordens do banco:', err);
          return null;
        }),
      ]);

      if (loadedPerfis !== null) {
        setPerfis(loadedPerfis);
        localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify(loadedPerfis));
      }

      if (loadedProjetos !== null) {
        setProjetos(loadedProjetos);
        localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify(loadedProjetos));
      }

      if (loadedDetalhadas !== null) {
        setOrdensServico(loadedDetalhadas.ordens);
        setAlocacoes(loadedDetalhadas.alocacoes);
        localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(loadedDetalhadas.ordens));
        localStorage.setItem(STORAGE_KEYS.ALOCACOES, JSON.stringify(loadedDetalhadas.alocacoes));
      }

      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
    } catch (err: any) {
      console.error('[SisGOS] Erro na sincronização com banco:', err);
      setSyncError(err.message || 'Falha ao sincronizar com o banco de dados');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Ao montar o componente, sincroniza imediatamente com o banco de dados
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Reset to default (Seed no Banco de Dados)
  const resetToInitialData = async () => {
    setIsSyncing(true);
    try {
      await apiService.adminResetSeed();
      await refreshData();
    } catch (err) {
      console.warn('[SisGOS] Falha no reset-seed via API, aplicando localmente:', err);
      setProjetos(INITIAL_PROJETOS);
      setPerfis(INITIAL_PERFIS);
      setOrdensServico(INITIAL_ORDENS_SERVICO);
      setAlocacoes(INITIAL_ALOCACOES);
      localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify(INITIAL_PROJETOS));
      localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify(INITIAL_PERFIS));
      localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(INITIAL_ORDENS_SERVICO));
      localStorage.setItem(STORAGE_KEYS.ALOCACOES, JSON.stringify(INITIAL_ALOCACOES));
    } finally {
      setIsSyncing(false);
    }
  };

  // Limpar todos os dados da aplicação e do Banco de Dados (PostgreSQL TRUNCATE CASCADE)
  const clearAllData = async () => {
    setIsSyncing(true);
    try {
      await apiService.adminClearData();
    } catch (err) {
      console.warn('[SisGOS] Falha ao acionar /api/v1/admin/clear-data:', err);
    } finally {
      setProjetos([]);
      setPerfis([]);
      setOrdensServico([]);
      setAlocacoes([]);
      localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ALOCACOES, JSON.stringify([]));
      setIsSyncing(false);
    }
  };

  // Projetos CRUD
  const addProjeto = (p: Omit<Projeto, 'id' | 'criado_em'>): Projeto => {
    const tempId = projetos.length > 0 ? Math.max(...projetos.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const optimisticProjeto: Projeto = { ...p, id: tempId, criado_em: now };
    
    setProjetos(prev => [optimisticProjeto, ...prev]);

    // Persiste no banco de dados via API
    apiService.createProjeto(p)
      .then(saved => {
        setProjetos(prev => prev.map(item => item.id === tempId ? saved : item));
      })
      .catch(err => {
        console.warn('[SisGOS] Não foi possível persistir projeto no backend:', err);
      });

    return optimisticProjeto;
  };

  const updateProjeto = (id: number, p: Partial<Projeto>) => {
    setProjetos(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    apiService.updateProjeto(id, p).catch(err => {
      console.warn('[SisGOS] Não foi possível atualizar projeto no backend:', err);
    });
  };

  const deleteProjeto = (id: number): { success: boolean; message?: string } => {
    const hasOs = ordensServico.some(os => os.projeto_id === id);
    if (hasOs) {
      return {
        success: false,
        message: 'Não é possível excluir este projeto pois existem Ordens de Serviço vinculadas a ele (Restrição de Integridade Referencial ON DELETE RESTRICT).'
      };
    }
    setProjetos(prev => prev.filter(item => item.id !== id));
    apiService.deleteProjeto(id).catch(err => {
      console.warn('[SisGOS] Não foi possível excluir projeto no backend:', err);
    });
    return { success: true };
  };

  // Perfis CRUD
  const addPerfil = (p: Omit<PerfilContratado, 'id' | 'criado_em'>): PerfilContratado => {
    const tempId = perfis.length > 0 ? Math.max(...perfis.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const optimisticPerfil: PerfilContratado = { ...p, id: tempId, criado_em: now };
    
    setPerfis(prev => [optimisticPerfil, ...prev]);

    // Persiste diretamente no banco de dados via API
    apiService.createPerfil(p)
      .then(saved => {
        setPerfis(prev => prev.map(item => item.id === tempId ? saved : item));
      })
      .catch(err => {
        console.warn('[SisGOS] Não foi possível persistir perfil contratado no backend:', err);
      });

    return optimisticPerfil;
  };

  const updatePerfil = (id: number, p: Partial<PerfilContratado>) => {
    setPerfis(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    apiService.updatePerfil(id, p).catch(err => {
      console.warn('[SisGOS] Não foi possível atualizar perfil no backend:', err);
    });
  };

  const deletePerfil = (id: number): { success: boolean; message?: string } => {
    const hasAlocacao = alocacoes.some(a => a.perfil_contratado_id === id);
    if (hasAlocacao) {
      return {
        success: false,
        message: 'Não é possível excluir este perfil contratado pois existem alocações históricas vinculadas a ele. Recomenda-se desativar a vigência (Vigente = Não).'
      };
    }
    setPerfis(prev => prev.filter(item => item.id !== id));
    apiService.deletePerfil(id).catch(err => {
      console.warn('[SisGOS] Não foi possível excluir perfil no backend:', err);
    });
    return { success: true };
  };

  const toggleVigenciaPerfil = (id: number) => {
    setPerfis(prev => prev.map(p => p.id === id ? { ...p, vigente: !p.vigente } : p));
    apiService.toggleVigenciaPerfil(id).catch(err => {
      console.warn('[SisGOS] Não foi possível alternar vigência no backend:', err);
    });
  };

  // Ordens de Serviço CRUD
  const addOrdemServico = (os: Omit<OrdemServico, 'id' | 'criado_em'>): OrdemServico => {
    const tempId = ordensServico.length > 0 ? Math.max(...ordensServico.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const optimisticOs: OrdemServico = { ...os, id: tempId, criado_em: now };
    
    setOrdensServico(prev => [optimisticOs, ...prev]);

    apiService.createOrdemServico(os)
      .then(saved => {
        setOrdensServico(prev => prev.map(item => item.id === tempId ? saved : item));
      })
      .catch(err => {
        console.warn('[SisGOS] Não foi possível persistir Ordem de Serviço no backend:', err);
      });

    return optimisticOs;
  };

  const updateOrdemServico = (id: number, os: Partial<OrdemServico>) => {
    setOrdensServico(prev => prev.map(item => item.id === id ? { ...item, ...os } : item));
    apiService.updateOrdemServico(id, os).catch(err => {
      console.warn('[SisGOS] Não foi possível atualizar Ordem de Serviço no backend:', err);
    });
  };

  const deleteOrdemServico = (id: number) => {
    setAlocacoes(prev => prev.filter(a => a.ordem_servico_id !== id));
    setOrdensServico(prev => prev.filter(item => item.id !== id));
    apiService.deleteOrdemServico(id).catch(err => {
      console.warn('[SisGOS] Não foi possível excluir Ordem de Serviço no backend:', err);
    });
  };

  // Alocações N:N
  const getAlocacoesByOs = (osId: number): AlocacaoPerfilOs[] => {
    return alocacoes.filter(a => a.ordem_servico_id === osId);
  };

  const addAlocacao = (params: {
    ordem_servico_id: number;
    perfil_contratado_id: number;
    mes_referencia: MesReferencia;
    nome_profissional: string;
    percentual_alocacao: number;
  }): AlocacaoPerfilOs => {
    const perfil = perfis.find(p => p.id === params.perfil_contratado_id);
    if (!perfil) {
      throw new Error(`Perfil contratado com ID ${params.perfil_contratado_id} não encontrado.`);
    }

    // Validação de Unicidade: CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, nome_profissional, mes_referencia)
    const isDuplicate = alocacoes.some(
      a => a.ordem_servico_id === params.ordem_servico_id &&
           a.nome_profissional.trim().toLowerCase() === params.nome_profissional.trim().toLowerCase() &&
           a.mes_referencia === params.mes_referencia
    );
    if (isDuplicate) {
      throw new Error(`Violação da restrição de unicidade (CONSTRAINT UNIQUE unq_alocacao_os_perfil_mes): Já existe uma alocação para o profissional '${params.nome_profissional.trim()}' no mês ${params.mes_referencia} nesta Ordem de Serviço.`);
    }

    const custoMensal = perfil.custo_mensal_perfil;
    const docRef = perfil.documento_referencia;
    const custoAlocacao = (params.percentual_alocacao * custoMensal) / 100;

    const tempId = alocacoes.length > 0 ? Math.max(...alocacoes.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const novaAlocacao: AlocacaoPerfilOs = {
      id: tempId,
      ordem_servico_id: params.ordem_servico_id,
      perfil_contratado_id: params.perfil_contratado_id,
      mes_referencia: params.mes_referencia,
      nome_profissional: params.nome_profissional.trim(),
      percentual_alocacao: params.percentual_alocacao,
      documento_referencia: docRef,
      custo_mensal_perfil: custoMensal,
      custo_alocacao: Math.round(custoAlocacao * 100) / 100,
      criado_em: now,
    };

    setAlocacoes(prev => [novaAlocacao, ...prev]);

    apiService.createAlocacao(params.ordem_servico_id, params)
      .then(saved => {
        setAlocacoes(prev => prev.map(a => a.id === tempId ? saved : a));
      })
      .catch(err => {
        console.warn('[SisGOS] Não foi possível persistir alocação no backend:', err);
      });

    return novaAlocacao;
  };

  const updateAlocacao = (
    id: number,
    params: {
      perfil_contratado_id: number;
      mes_referencia: MesReferencia;
      nome_profissional: string;
      percentual_alocacao: number;
    }
  ) => {
    const perfil = perfis.find(p => p.id === params.perfil_contratado_id);
    if (!perfil) return;

    const targetAloc = alocacoes.find(a => a.id === id);
    const osId = targetAloc ? targetAloc.ordem_servico_id : 0;

    // Validação de Unicidade: CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, nome_profissional, mes_referencia)
    const isDuplicate = alocacoes.some(
      a => a.id !== id &&
           a.ordem_servico_id === osId &&
           a.nome_profissional.trim().toLowerCase() === params.nome_profissional.trim().toLowerCase() &&
           a.mes_referencia === params.mes_referencia
    );
    if (isDuplicate) {
      throw new Error(`Violação da restrição de unicidade (CONSTRAINT UNIQUE unq_alocacao_os_perfil_mes): Já existe outra alocação para o profissional '${params.nome_profissional.trim()}' no mês ${params.mes_referencia} nesta Ordem de Serviço.`);
    }

    const custoMensal = perfil.custo_mensal_perfil;
    const docRef = perfil.documento_referencia;
    const custoAlocacao = (params.percentual_alocacao * custoMensal) / 100;

    setAlocacoes(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          perfil_contratado_id: params.perfil_contratado_id,
          mes_referencia: params.mes_referencia,
          nome_profissional: params.nome_profissional.trim(),
          percentual_alocacao: params.percentual_alocacao,
          documento_referencia: docRef,
          custo_mensal_perfil: custoMensal,
          custo_alocacao: Math.round(custoAlocacao * 100) / 100,
        };
      }
      return a;
    }));

    if (osId) {
      apiService.updateAlocacao(osId, id, params).catch(err => {
        console.warn('[SisGOS] Não foi possível atualizar alocação no backend:', err);
      });
    }
  };

  const deleteAlocacao = (id: number) => {
    const target = alocacoes.find(a => a.id === id);
    const osId = target ? target.ordem_servico_id : 0;
    setAlocacoes(prev => prev.filter(a => a.id !== id));
    if (osId) {
      apiService.deleteAlocacao(osId, id).catch(err => {
        console.warn('[SisGOS] Não foi possível excluir alocação no backend:', err);
      });
    }
  };

  const getCalculoValorTotalOS = (osId: number): number => {
    const osAlocacoes = alocacoes.filter(a => a.ordem_servico_id === osId);
    const total = osAlocacoes.reduce((acc, curr) => acc + (curr.custo_alocacao || 0), 0);
    return Math.round(total * 100) / 100;
  };

  const getNomesProfissionaisDistintos = (): string[] => {
    const nomes = alocacoes
      .map(a => a.nome_profissional?.trim())
      .filter(Boolean) as string[];
    return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b));
  };

  return (
    <SisgosContext.Provider
      value={{
        projetos,
        perfis,
        ordensServico,
        alocacoes,
        isSyncing,
        lastSyncedAt,
        syncError,
        refreshData,
        addProjeto,
        updateProjeto,
        deleteProjeto,
        addPerfil,
        updatePerfil,
        deletePerfil,
        toggleVigenciaPerfil,
        addOrdemServico,
        updateOrdemServico,
        deleteOrdemServico,
        getAlocacoesByOs,
        addAlocacao,
        updateAlocacao,
        deleteAlocacao,
        getCalculoValorTotalOS,
        getNomesProfissionaisDistintos,
        resetToInitialData,
        clearAllData,
      }}
    >
      {children}
    </SisgosContext.Provider>
  );
};

export const useSisgos = (): SisgosContextType => {
  const context = useContext(SisgosContext);
  if (!context) {
    throw new Error('useSisgos deve ser utilizado dentro de um SisgosProvider');
  }
  return context;
};
