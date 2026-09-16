import { TableDefinition } from '../types/schema';

export const TABLES_METADATA: TableDefinition[] = [
  {
    id: 'perfis_contratados',
    name: 'perfis_contratados',
    displayName: 'Perfis Contratados',
    description: 'Catálogo de perfis profissionais disponíveis no contrato administrativo, com valores acordados e quantidades contratadas.',
    type: 'entity',
    columns: [
      {
        name: 'id',
        originalName: 'ID',
        type: 'BIGSERIAL / INT AUTO_INCREMENT',
        nullable: false,
        isPk: true,
        description: 'Chave primária única e sequencial do perfil contratado.'
      },
      {
        name: 'item_contratacao',
        originalName: 'Item da Contratação',
        type: 'VARCHAR(100)',
        nullable: false,
        description: 'Identificador do item do contrato (ex: "Item 01", "Lote 2 - Item 4").'
      },
      {
        name: 'nome_perfil',
        originalName: 'Nome do Perfil',
        type: 'VARCHAR(150)',
        nullable: false,
        description: 'Denominação do perfil profissional (ex: "Desenvolvedor Full-Stack Pleno", "Arquiteto de Soluções").'
      },
      {
        name: 'documento_referencia',
        originalName: 'Documento de Referência',
        type: 'VARCHAR(255)',
        nullable: false,
        description: 'Identificador do termo ou contrato base (ex: "TR 04/2025 - SEPLAG", "Contrato 12/2024").'
      },
      {
        name: 'vigente',
        originalName: 'Vigente',
        type: 'BOOLEAN',
        nullable: false,
        defaultValue: 'TRUE',
        description: 'Indica se o perfil está ativo e disponível para novas alocações em Ordens de Serviço.'
      },
      {
        name: 'custo_mensal_perfil',
        originalName: 'Custo Mensal do Perfil',
        type: 'DECIMAL(12, 2)',
        nullable: false,
        description: 'Valor mensal contratado do perfil em Reais (R$, padrão brasileiro, duas casas decimais).'
      },
      {
        name: 'quantidade_mensal_contratada',
        originalName: 'Quantidade Mensal Contratada',
        type: 'INTEGER',
        nullable: false,
        checkConstraint: 'quantidade_mensal_contratada >= 0',
        description: 'Quantidade de vagas/postos mensais contratados para este perfil.'
      },
      {
        name: 'criado_em',
        originalName: 'Data de Criação',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Registro de auditoria da inclusão no sistema.'
      }
    ],
    relationships: [
      {
        targetTable: 'alocacoes_perfil_os',
        type: '1:N',
        description: 'Um Perfil Contratado pode ser alocado em múltiplas Ordens de Serviço.',
        foreignKey: 'alocacoes_perfil_os.perfil_contratado_id'
      }
    ]
  },
  {
    id: 'projetos',
    name: 'projetos',
    displayName: 'Projeto',
    description: 'Projetos e iniciativas das Secretarias aos quais as Ordens de Serviço são vinculadas.',
    type: 'entity',
    columns: [
      {
        name: 'id',
        originalName: 'ID',
        type: 'BIGSERIAL / INT AUTO_INCREMENT',
        nullable: false,
        isPk: true,
        description: 'Chave primária do projeto.'
      },
      {
        name: 'nome_projeto',
        originalName: 'Nome do Projeto',
        type: 'VARCHAR(200)',
        nullable: false,
        description: 'Nome completo descritivo do projeto institucional.'
      },
      {
        name: 'sigla_projeto',
        originalName: 'Sigla do Projeto',
        type: 'VARCHAR(50)',
        nullable: false,
        description: 'Código ou acrônimo identificador do projeto (ex: "SGC-CORP", "PORTAL-TRANS").'
      },
      {
        name: 'descricao',
        originalName: 'Descrição',
        type: 'VARCHAR(500)',
        nullable: true,
        description: 'Texto detalhado ou escopo resumido do projeto.'
      },
      {
        name: 'nome_secretaria',
        originalName: 'Nome da Secretaria',
        type: 'VARCHAR(200)',
        nullable: false,
        description: 'Nome completo da Secretaria demandante ou contratante.'
      },
      {
        name: 'sigla_secretaria',
        originalName: 'Sigla da Secretaria',
        type: 'VARCHAR(50)',
        nullable: false,
        description: 'Sigla oficial da Secretaria (ex: "SEPLAG", "SEFAZ", "SES", "SEDUC").'
      },
      {
        name: 'criado_em',
        originalName: 'Data de Criação',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Data e hora do cadastro do projeto.'
      }
    ],
    relationships: [
      {
        targetTable: 'ordens_servico',
        type: '1:N',
        description: 'Um Projeto possui várias Ordens de Serviço (1:N).',
        foreignKey: 'ordens_servico.projeto_id'
      }
    ]
  },
  {
    id: 'ordens_servico',
    name: 'ordens_servico',
    displayName: 'Ordem de Serviço',
    description: 'Ordens de Serviço emitidas no âmbito dos Projetos, vinculadas a um ano/mês de referência e acompanhadas no SGC.',
    type: 'entity',
    columns: [
      {
        name: 'id',
        originalName: 'ID',
        type: 'BIGSERIAL / INT AUTO_INCREMENT',
        nullable: false,
        isPk: true,
        description: 'Chave primária única da Ordem de Serviço.'
      },
      {
        name: 'projeto_id',
        originalName: 'Projeto Vinculado',
        type: 'BIGINT / INT',
        nullable: false,
        isFk: true,
        fkTarget: 'projetos(id)',
        description: 'Chave estrangeira referenciando a tabela de Projetos (relação 1:N: 1 Projeto -> N Ordens de Serviço).'
      },
      {
        name: 'numero_os',
        originalName: 'Número da OS',
        type: 'INTEGER',
        nullable: false,
        checkConstraint: 'numero_os > 0',
        description: 'Número sequencial da Ordem de Serviço.'
      },
      {
        name: 'ano_referencia',
        originalName: 'Ano de referência',
        type: 'INTEGER',
        nullable: false,
        description: 'Ano de vigência ou execução da OS (ex: 2025, 2026).'
      },
      {
        name: 'alocacao_sgc',
        originalName: 'Alocação no SGC',
        type: 'BOOLEAN',
        nullable: false,
        defaultValue: 'FALSE',
        description: 'Status que indica se a alocação de equipe foi devidamente registrada no sistema SGC.'
      },
      {
        name: 'entrega_sgc',
        originalName: 'Entrega no SGC',
        type: 'BOOLEAN',
        nullable: false,
        defaultValue: 'FALSE',
        description: 'Status que indica se as entregas da OS foram registradas no SGC.'
      },
      {
        name: 'descricao_sgc',
        originalName: 'Descrição no SGC',
        type: 'BOOLEAN',
        nullable: false,
        defaultValue: 'FALSE',
        description: 'Status que indica se a descrição dos serviços está preenchida no SGC.'
      },
      {
        name: 'situacao_sgc',
        originalName: 'Situação no SGC',
        type: 'VARCHAR(100)',
        nullable: true,
        description: 'Estado atual no SGC (ex: "Em Elaboração", "Aprovada", "Atestada", "Faturada").'
      },
      {
        name: 'situacao_passivo_2026',
        originalName: 'Situação do Passivo 2026',
        type: 'VARCHAR(100)',
        nullable: true,
        description: 'Status de controle do passivo orçamentário/financeiro para o exercício de 2026.'
      },
      {
        name: 'criado_em',
        originalName: 'Data de Criação',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Registro de auditoria.'
      }
    ],
    relationships: [
      {
        targetTable: 'projetos',
        type: 'N:1',
        description: 'Uma Ordem de Serviço pertence a exatamente um Projeto.',
        foreignKey: 'projeto_id'
      },
      {
        targetTable: 'alocacoes_perfil_os',
        type: '1:N',
        description: 'Uma Ordem de Serviço possui várias Alocações de Perfis (N:N via associativa).',
        foreignKey: 'alocacoes_perfil_os.ordem_servico_id'
      }
    ]
  },
  {
    id: 'alocacoes_perfil_os',
    name: 'alocacoes_perfil_os',
    displayName: 'Alocação de Perfis na Ordem de Serviço',
    description: 'Tabela associativa (N:N) que materializa a alocação dos perfis profissionais em cada Ordem de Serviço, com regra de negócio de snapshot e cálculo automático.',
    type: 'associative',
    columns: [
      {
        name: 'id',
        originalName: 'ID',
        type: 'BIGSERIAL / INT AUTO_INCREMENT',
        nullable: false,
        isPk: true,
        description: 'Identificador primário da alocação.'
      },
      {
        name: 'ordem_servico_id',
        originalName: 'Ordem de Serviço (FK)',
        type: 'BIGINT / INT',
        nullable: false,
        isFk: true,
        fkTarget: 'ordens_servico(id)',
        description: 'Chave estrangeira vinculando à Ordem de Serviço.'
      },
      {
        name: 'perfil_contratado_id',
        originalName: 'Perfil Contratado (FK)',
        type: 'BIGINT / INT',
        nullable: false,
        isFk: true,
        fkTarget: 'perfis_contratados(id)',
        description: 'Chave estrangeira vinculando ao Perfil Contratado base.'
      },
      {
        name: 'mes_referencia',
        originalName: 'Mês de referência',
        type: 'VARCHAR(20)',
        nullable: false,
        checkConstraint: "mes_referencia IN ('JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO')",
        description: 'Mês de referência da alocação (CONSTRAINT chk_os_mes_valido). Compõe a chave única CONSTRAINT UNIQUE (ordem_servico_id, perfil_contratado_id, mes_referencia).'
      },
      {
        name: 'nome_profissional',
        originalName: 'Nome do Profissional',
        type: 'VARCHAR(200)',
        nullable: false,
        description: 'Nome do profissional alocado na Ordem de Serviço.'
      },
      {
        name: 'percentual_alocacao',
        originalName: 'Percentual de Alocação',
        type: 'NUMERIC(5, 2)',
        nullable: false,
        checkConstraint: 'percentual_alocacao >= 0.00 AND percentual_alocacao <= 100.00',
        description: 'Percentual de dedicação mensal do profissional na OS com até duas casas decimais (ex: 33.33%, 45.50%, 50.00%, 100.00%).'
      },
      {
        name: 'documento_referencia',
        originalName: 'Documento de Referência',
        type: 'VARCHAR(255)',
        nullable: false,
        businessRule: 'Copiado automaticamente de perfis_contratados.documento_referencia no momento da inserção (Snapshot histórico).',
        description: 'Documento de referência histórico congelado na data da alocação.'
      },
      {
        name: 'custo_mensal_perfil',
        originalName: 'Custo Mensal do Perfil',
        type: 'DECIMAL(12, 2)',
        nullable: false,
        businessRule: 'Copiado automaticamente de perfis_contratados.custo_mensal_perfil no momento da inserção (Snapshot de preço).',
        description: 'Custo unitário mensal do perfil congelado para proteger contra reajustes futuros.'
      },
      {
        name: 'custo_alocacao',
        originalName: 'Custo da Alocação',
        type: 'DECIMAL(12, 2)',
        nullable: false,
        businessRule: 'Calculado automaticamente: (percentual_alocacao * custo_mensal_perfil) / 100.0',
        description: 'Valor proporcional da alocação gerado pela regra de negócio.'
      },
      {
        name: 'criado_em',
        originalName: 'Data de Criação',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        description: 'Data do registro.'
      }
    ],
    relationships: [
      {
        targetTable: 'ordens_servico',
        type: 'N:1',
        description: 'Pertence a uma Ordem de Serviço.',
        foreignKey: 'ordem_servico_id'
      },
      {
        targetTable: 'perfis_contratados',
        type: 'N:1',
        description: 'Referencia as especificações do Perfil Contratado.',
        foreignKey: 'perfil_contratado_id'
      }
    ]
  }
];
