export type MesReferencia = 
  | 'JANEIRO' 
  | 'FEVEREIRO' 
  | 'MARÇO' 
  | 'ABRIL' 
  | 'MAIO' 
  | 'JUNHO' 
  | 'JULHO' 
  | 'AGOSTO' 
  | 'SETEMBRO' 
  | 'OUTUBRO' 
  | 'NOVEMBRO' 
  | 'DEZEMBRO';

export const MESES_REFERENCIA: MesReferencia[] = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO'
];

export interface Projeto {
  id: number;
  nome_projeto: string;
  sigla_projeto: string;
  descricao: string;
  nome_secretaria: string;
  sigla_secretaria: string;
  criado_em?: string;
}

export interface PerfilContratado {
  id: number;
  item_contratacao: string;
  nome_perfil: string;
  documento_referencia: string;
  vigente: boolean;
  custo_mensal_perfil: number;
  quantidade_mensal_contratada: number;
  criado_em?: string;
}

export interface OrdemServico {
  id: number;
  projeto_id: number;
  numero_os: number;
  ano_referencia: number;
  alocacao_sgc: boolean;
  entrega_sgc: boolean;
  descricao_sgc: boolean;
  situacao_sgc: string;
  situacao_passivo_2026: string;
  criado_em?: string;
}

export interface AlocacaoPerfilOs {
  id: number;
  ordem_servico_id: number;
  perfil_contratado_id: number;
  mes_referencia: MesReferencia;
  nome_profissional: string;
  percentual_alocacao: number;
  documento_referencia: string;
  custo_mensal_perfil: number;
  custo_alocacao: number;
  criado_em?: string;
}
