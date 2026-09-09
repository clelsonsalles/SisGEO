import React, { createContext, useContext, useState, useEffect } from 'react';
import { Projeto, PerfilContratado, OrdemServico, AlocacaoPerfilOs } from '../types/models';
import { INITIAL_PROJETOS, INITIAL_PERFIS, INITIAL_ORDENS_SERVICO, INITIAL_ALOCACOES } from '../data/initialData';

interface SisgosContextType {
  projetos: Projeto[];
  perfis: PerfilContratado[];
  ordensServico: OrdemServico[];
  alocacoes: AlocacaoPerfilOs[];
  
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
    nome_profissional: string;
    percentual_alocacao: number;
  }) => AlocacaoPerfilOs;
  updateAlocacao: (
    id: number,
    params: {
      perfil_contratado_id: number;
      nome_profissional: string;
      percentual_alocacao: number;
    }
  ) => void;
  deleteAlocacao: (id: number) => void;

  // Regras de Negócio & Cálculos
  getCalculoValorTotalOS: (osId: number) => number;
  getNomesProfissionaisDistintos: () => string[];
  resetToInitialData: () => void;
  clearAllData: () => void;
}

const SisgosContext = createContext<SisgosContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJETOS: 'sisgos_projetos_v1',
  PERFIS: 'sisgos_perfis_v1',
  ORDENS: 'sisgos_ordens_v1',
  ALOCACOES: 'sisgos_alocacoes_v1',
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

  // Sync with localStorage
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

  // Reset to default (Seed)
  const resetToInitialData = () => {
    setProjetos(INITIAL_PROJETOS);
    setPerfis(INITIAL_PERFIS);
    setOrdensServico(INITIAL_ORDENS_SERVICO);
    setAlocacoes(INITIAL_ALOCACOES);
    localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify(INITIAL_PROJETOS));
    localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify(INITIAL_PERFIS));
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify(INITIAL_ORDENS_SERVICO));
    localStorage.setItem(STORAGE_KEYS.ALOCACOES, JSON.stringify(INITIAL_ALOCACOES));
  };

  // Limpar todos os dados da aplicação (restaura base limpa com tabelas vazias)
  const clearAllData = () => {
    setProjetos([]);
    setPerfis([]);
    setOrdensServico([]);
    setAlocacoes([]);
    localStorage.setItem(STORAGE_KEYS.PROJETOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ORDENS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ALOCACOES, JSON.stringify([]));
  };

  // Projetos CRUD
  const addProjeto = (p: Omit<Projeto, 'id' | 'criado_em'>): Projeto => {
    const newId = projetos.length > 0 ? Math.max(...projetos.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newProjeto: Projeto = { ...p, id: newId, criado_em: now };
    setProjetos(prev => [newProjeto, ...prev]);
    return newProjeto;
  };

  const updateProjeto = (id: number, p: Partial<Projeto>) => {
    setProjetos(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
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
    return { success: true };
  };

  // Perfis CRUD
  const addPerfil = (p: Omit<PerfilContratado, 'id' | 'criado_em'>): PerfilContratado => {
    const newId = perfis.length > 0 ? Math.max(...perfis.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newPerfil: PerfilContratado = { ...p, id: newId, criado_em: now };
    setPerfis(prev => [newPerfil, ...prev]);
    return newPerfil;
  };

  const updatePerfil = (id: number, p: Partial<PerfilContratado>) => {
    setPerfis(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
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
    return { success: true };
  };

  const toggleVigenciaPerfil = (id: number) => {
    setPerfis(prev => prev.map(p => p.id === id ? { ...p, vigente: !p.vigente } : p));
  };

  // Ordens de Serviço CRUD
  const addOrdemServico = (os: Omit<OrdemServico, 'id' | 'criado_em'>): OrdemServico => {
    const newId = ordensServico.length > 0 ? Math.max(...ordensServico.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newOs: OrdemServico = { ...os, id: newId, criado_em: now };
    setOrdensServico(prev => [newOs, ...prev]);
    return newOs;
  };

  const updateOrdemServico = (id: number, os: Partial<OrdemServico>) => {
    setOrdensServico(prev => prev.map(item => item.id === id ? { ...item, ...os } : item));
  };

  const deleteOrdemServico = (id: number) => {
    // Cascade delete alocações for this OS
    setAlocacoes(prev => prev.filter(a => a.ordem_servico_id !== id));
    setOrdensServico(prev => prev.filter(item => item.id !== id));
  };

  // Alocações N:N
  const getAlocacoesByOs = (osId: number): AlocacaoPerfilOs[] => {
    return alocacoes.filter(a => a.ordem_servico_id === osId);
  };

  /**
   * REGRA DE NEGÓCIO DA ALOCAÇÃO:
   * 1. Cópia do "Custo Mensal do Perfil" da linha associada em Perfis Contratados
   * 2. Cópia do "Documento de Referência" da linha associada em Perfis Contratados
   * 3. Cálculo do "Custo da Alocação" = (Percentual de Alocação * Custo Mensal do Perfil) / 100
   */
  const addAlocacao = (params: {
    ordem_servico_id: number;
    perfil_contratado_id: number;
    nome_profissional: string;
    percentual_alocacao: number;
  }): AlocacaoPerfilOs => {
    const perfil = perfis.find(p => p.id === params.perfil_contratado_id);
    if (!perfil) {
      throw new Error(`Perfil contratado com ID ${params.perfil_contratado_id} não encontrado.`);
    }

    const custoMensal = perfil.custo_mensal_perfil;
    const docRef = perfil.documento_referencia;
    const custoAlocacao = (params.percentual_alocacao * custoMensal) / 100;

    const newId = alocacoes.length > 0 ? Math.max(...alocacoes.map(x => x.id)) + 1 : 1;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const novaAlocacao: AlocacaoPerfilOs = {
      id: newId,
      ordem_servico_id: params.ordem_servico_id,
      perfil_contratado_id: params.perfil_contratado_id,
      nome_profissional: params.nome_profissional.trim(),
      percentual_alocacao: params.percentual_alocacao,
      documento_referencia: docRef,
      custo_mensal_perfil: custoMensal,
      custo_alocacao: Math.round(custoAlocacao * 100) / 100,
      criado_em: now
    };

    setAlocacoes(prev => [novaAlocacao, ...prev]);
    return novaAlocacao;
  };

  const updateAlocacao = (
    id: number,
    params: {
      perfil_contratado_id: number;
      nome_profissional: string;
      percentual_alocacao: number;
    }
  ) => {
    const perfil = perfis.find(p => p.id === params.perfil_contratado_id);
    if (!perfil) return;

    const custoMensal = perfil.custo_mensal_perfil;
    const docRef = perfil.documento_referencia;
    const custoAlocacao = (params.percentual_alocacao * custoMensal) / 100;

    setAlocacoes(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          perfil_contratado_id: params.perfil_contratado_id,
          nome_profissional: params.nome_profissional.trim(),
          percentual_alocacao: params.percentual_alocacao,
          documento_referencia: docRef,
          custo_mensal_perfil: custoMensal,
          custo_alocacao: Math.round(custoAlocacao * 100) / 100
        };
      }
      return a;
    }));
  };

  const deleteAlocacao = (id: number) => {
    setAlocacoes(prev => prev.filter(a => a.id !== id));
  };

  /**
   * REGRA DE NEGÓCIO:
   * Cálculo do valor total da Ordem de Serviço:
   * Somar os valores calculados de cada linha do valor da alocação de perfis na OS.
   */
  const getCalculoValorTotalOS = (osId: number): number => {
    const osAlocacoes = alocacoes.filter(a => a.ordem_servico_id === osId);
    const total = osAlocacoes.reduce((acc, curr) => acc + (curr.custo_alocacao || 0), 0);
    return Math.round(total * 100) / 100;
  };

  /**
   * REGRA DE NEGÓCIO:
   * Campo "Nome do Profissional": Apresentar uma lista com os nomes distintos
   * que já foram incluídos em todas as outras alocações.
   */
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
        clearAllData
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
