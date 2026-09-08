import { Projeto, PerfilContratado, OrdemServico, AlocacaoPerfilOs } from '../types/models';

export const INITIAL_PROJETOS: Projeto[] = [
  {
    id: 1,
    nome_projeto: 'Sistema de Gestão Corporativa Integrada',
    sigla_projeto: 'SGC-CORP',
    descricao: 'Modernização do fluxo de processos, tramitação e compras governamentais integradas.',
    nome_secretaria: 'Secretaria de Estado de Planejamento e Gestão',
    sigla_secretaria: 'SEPLAG',
    criado_em: '2026-01-15 09:00:00'
  },
  {
    id: 2,
    nome_projeto: 'Portal da Transparência e Arrecadação Digital',
    sigla_projeto: 'TRANS-SEFAZ',
    descricao: 'Plataforma fiscal de autoatendimento, transparência ativa e conformidade tributária.',
    nome_secretaria: 'Secretaria da Fazenda',
    sigla_secretaria: 'SEFAZ',
    criado_em: '2026-01-20 10:30:00'
  },
  {
    id: 3,
    nome_projeto: 'Prontuário Eletrônico Unificado Estadual',
    sigla_projeto: 'PEU-SAUDE',
    descricao: 'Integração de unidades básicas de saúde, hospitais de referência e regulação de leitos.',
    nome_secretaria: 'Secretaria de Estado de Saúde',
    sigla_secretaria: 'SES',
    criado_em: '2026-02-01 14:15:00'
  },
  {
    id: 4,
    nome_projeto: 'Plataforma Integrada da Educação Conectada',
    sigla_projeto: 'EDU-DIGITAL',
    descricao: 'Gestão escolar, diário de classe eletrônico e recursos pedagógicos digitais.',
    nome_secretaria: 'Secretaria de Estado de Educação',
    sigla_secretaria: 'SEDUC',
    criado_em: '2026-02-10 11:00:00'
  }
];

export const INITIAL_PERFIS: PerfilContratado[] = [
  {
    id: 1,
    item_contratacao: 'Item 01',
    nome_perfil: 'Líder Técnico / Arquiteto de Software',
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    vigente: true,
    custo_mensal_perfil: 18500.00,
    quantidade_mensal_contratada: 3,
    criado_em: '2025-11-01 08:00:00'
  },
  {
    id: 2,
    item_contratacao: 'Item 02',
    nome_perfil: 'Desenvolvedor Full-Stack Sênior',
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    vigente: true,
    custo_mensal_perfil: 14200.00,
    quantidade_mensal_contratada: 6,
    criado_em: '2025-11-01 08:00:00'
  },
  {
    id: 3,
    item_contratacao: 'Item 03',
    nome_perfil: 'Desenvolvedor Full-Stack Pleno',
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    vigente: true,
    custo_mensal_perfil: 9800.00,
    quantidade_mensal_contratada: 10,
    criado_em: '2025-11-01 08:00:00'
  },
  {
    id: 4,
    item_contratacao: 'Item 04',
    nome_perfil: 'Analista de Requisitos e Negócios Pleno',
    documento_referencia: 'Contrato 45/2024 - Lote 2',
    vigente: true,
    custo_mensal_perfil: 9500.00,
    quantidade_mensal_contratada: 4,
    criado_em: '2025-11-01 08:00:00'
  },
  {
    id: 5,
    item_contratacao: 'Item 05',
    nome_perfil: 'Engenheiro de DevOps / Cloud Sênior',
    documento_referencia: 'Contrato 45/2024 - Lote 2',
    vigente: true,
    custo_mensal_perfil: 15000.00,
    quantidade_mensal_contratada: 2,
    criado_em: '2025-11-01 08:00:00'
  },
  {
    id: 6,
    item_contratacao: 'Item 06',
    nome_perfil: 'Designer UI/UX Pleno',
    documento_referencia: 'Contrato 45/2024 - Lote 2',
    vigente: true,
    custo_mensal_perfil: 8700.00,
    quantidade_mensal_contratada: 2,
    criado_em: '2025-11-01 08:00:00'
  }
];

export const INITIAL_ORDENS_SERVICO: OrdemServico[] = [
  {
    id: 1,
    projeto_id: 1,
    numero_os: 101,
    ano_referencia: 2026,
    mes_referencia: 'JANEIRO',
    alocacao_sgc: true,
    entrega_sgc: true,
    descricao_sgc: true,
    situacao_sgc: 'Atestada pelo Fiscal',
    situacao_passivo_2026: 'Liquidado',
    criado_em: '2026-01-05 10:00:00'
  },
  {
    id: 2,
    projeto_id: 1,
    numero_os: 102,
    ano_referencia: 2026,
    mes_referencia: 'FEVEREIRO',
    alocacao_sgc: true,
    entrega_sgc: true,
    descricao_sgc: false,
    situacao_sgc: 'Em Execução',
    situacao_passivo_2026: 'A Empenhar',
    criado_em: '2026-02-01 09:30:00'
  },
  {
    id: 3,
    projeto_id: 2,
    numero_os: 201,
    ano_referencia: 2026,
    mes_referencia: 'JANEIRO',
    alocacao_sgc: true,
    entrega_sgc: false,
    descricao_sgc: true,
    situacao_sgc: 'Em Validação SGC',
    situacao_passivo_2026: 'Passivo Reconhecido',
    criado_em: '2026-01-10 14:00:00'
  },
  {
    id: 4,
    projeto_id: 3,
    numero_os: 301,
    ano_referencia: 2026,
    mes_referencia: 'MARÇO',
    alocacao_sgc: false,
    entrega_sgc: false,
    descricao_sgc: false,
    situacao_sgc: 'Planejada',
    situacao_passivo_2026: 'Sem Passivo',
    criado_em: '2026-02-25 16:20:00'
  }
];

export const INITIAL_ALOCACOES: AlocacaoPerfilOs[] = [
  {
    id: 1,
    ordem_servico_id: 1,
    perfil_contratado_id: 1,
    nome_profissional: 'Carlos Eduardo Mendes',
    percentual_alocacao: 100,
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    custo_mensal_perfil: 18500.00,
    custo_alocacao: 18500.00,
    criado_em: '2026-01-05 10:10:00'
  },
  {
    id: 2,
    ordem_servico_id: 1,
    perfil_contratado_id: 2,
    nome_profissional: 'Mariana Vasconcelos',
    percentual_alocacao: 100,
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    custo_mensal_perfil: 14200.00,
    custo_alocacao: 14200.00,
    criado_em: '2026-01-05 10:12:00'
  },
  {
    id: 3,
    ordem_servico_id: 1,
    perfil_contratado_id: 3,
    nome_profissional: 'Rodrigo Silveira',
    percentual_alocacao: 50,
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    custo_mensal_perfil: 9800.00,
    custo_alocacao: 4900.00,
    criado_em: '2026-01-05 10:15:00'
  },
  {
    id: 4,
    ordem_servico_id: 2,
    perfil_contratado_id: 2,
    nome_profissional: 'Mariana Vasconcelos',
    percentual_alocacao: 50,
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    custo_mensal_perfil: 14200.00,
    custo_alocacao: 7100.00,
    criado_em: '2026-02-01 09:40:00'
  },
  {
    id: 5,
    ordem_servico_id: 2,
    perfil_contratado_id: 3,
    nome_profissional: 'Lucas Pinheiro',
    percentual_alocacao: 100,
    documento_referencia: 'Contrato 45/2024 - Lote 1',
    custo_mensal_perfil: 9800.00,
    custo_alocacao: 9800.00,
    criado_em: '2026-02-01 09:45:00'
  },
  {
    id: 6,
    ordem_servico_id: 3,
    perfil_contratado_id: 5,
    nome_profissional: 'Ana Beatriz Costa',
    percentual_alocacao: 100,
    documento_referencia: 'Contrato 45/2024 - Lote 2',
    custo_mensal_perfil: 15000.00,
    custo_alocacao: 15000.00,
    criado_em: '2026-01-10 14:10:00'
  }
];
