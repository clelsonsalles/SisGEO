export const POSTGRESQL_DDL = `-- ========================================================================
-- SISTEMA DE GERENCIAMENTO DE ORDENS DE SERVIÇO
-- DIALETO: PostgreSQL (14+)
-- MODELAGEM RELACIONAL COM INTEGRIDADE REFERENCIAL, CONSTRAINTS E TRIGGERS
-- ========================================================================

-- 1. Criação da Tabela: Perfis Contratados
CREATE TABLE perfis_contratados (
    id BIGSERIAL PRIMARY KEY,
    item_contratacao VARCHAR(100) NOT NULL,
    nome_perfil VARCHAR(150) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    quantidade_mensal_contratada INTEGER NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Restrições de Validação
    CONSTRAINT chk_perfis_custo_positivo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_perfis_qtd_positiva CHECK (quantidade_mensal_contratada >= 0)
);

COMMENT ON TABLE perfis_contratados IS 'Catálogo de perfis contratados com seus respectivos custos e documentos base';
COMMENT ON COLUMN perfis_contratados.custo_mensal_perfil IS 'Valor mensal em Reais (BRL) com duas casas decimais';


-- 2. Criação da Tabela: Projeto
CREATE TABLE projetos (
    id BIGSERIAL PRIMARY KEY,
    nome_projeto VARCHAR(200) NOT NULL,
    sigla_projeto VARCHAR(50) NOT NULL,
    descricao VARCHAR(500),
    nome_secretaria VARCHAR(200) NOT NULL,
    sigla_secretaria VARCHAR(50) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)
);

COMMENT ON TABLE projetos IS 'Cadastro de projetos institucionais vinculados às Secretarias';


-- 3. Criação da Tabela: Ordem de Serviço (1 Projeto -> N Ordens de Serviço)
CREATE TABLE ordens_servico (
    id BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    numero_os INTEGER NOT NULL,
    ano_referencia INTEGER NOT NULL,
    mes_referencia VARCHAR(20) NOT NULL,
    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    situacao_sgc VARCHAR(100),
    situacao_passivo_2026 VARCHAR(100),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Chave Estrangeira: 1:N (Um Projeto tem várias Ordens de Serviço)
    CONSTRAINT fk_os_projeto 
        FOREIGN KEY (projeto_id) 
        REFERENCES projetos (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Restrições de Domínio e Unicidade
    CONSTRAINT chk_os_numero_positivo CHECK (numero_os > 0),
    CONSTRAINT chk_os_ano_valido CHECK (ano_referencia BETWEEN 2000 AND 2100),
    CONSTRAINT chk_os_mes_valido CHECK (
        mes_referencia IN (
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 
            'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 
            'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        )
    ),
    CONSTRAINT unq_os_projeto_ano_mes UNIQUE (projeto_id, numero_os, ano_referencia)
);

CREATE INDEX idx_os_projeto_id ON ordens_servico(projeto_id);
CREATE INDEX idx_os_ano_mes ON ordens_servico(ano_referencia, mes_referencia);


-- 4. Criação da Tabela Associativa: Alocação de Perfis na Ordem de Serviço (N:N)
CREATE TABLE alocacoes_perfil_os (
    id BIGSERIAL PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL,
    perfil_contratado_id BIGINT NOT NULL,
    nome_profissional VARCHAR(200) NOT NULL,
    percentual_alocacao INTEGER NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    custo_alocacao NUMERIC(12, 2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Relacionamentos FK
    CONSTRAINT fk_alocacao_os 
        FOREIGN KEY (ordem_servico_id) 
        REFERENCES ordens_servico (id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,

    CONSTRAINT fk_alocacao_perfil 
        FOREIGN KEY (perfil_contratado_id) 
        REFERENCES perfis_contratados (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Restrições
    CONSTRAINT chk_percentual_alocacao CHECK (percentual_alocacao >= 0 AND percentual_alocacao <= 100),
    CONSTRAINT chk_custo_mensal_positivo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_custo_alocacao_positivo CHECK (custo_alocacao >= 0.00)
);

CREATE INDEX idx_alocacoes_os_id ON alocacoes_perfil_os(ordem_servico_id);
CREATE INDEX idx_alocacoes_perfil_id ON alocacoes_perfil_os(perfil_contratado_id);


-- ========================================================================
-- REGRA DE NEGÓCIO: TRIGGER AUTOMÁTICO PARA ALOCAÇÃO
-- 1. Copia documento_referencia e custo_mensal_perfil de perfis_contratados
-- 2. Calcula custo_alocacao = (percentual_alocacao * custo_mensal_perfil) / 100
-- ========================================================================

CREATE OR REPLACE FUNCTION fn_trg_processar_alocacao_perfil()
RETURNS TRIGGER AS $$
DECLARE
    v_custo_mensal NUMERIC(12, 2);
    v_doc_ref VARCHAR(255);
    v_vigente BOOLEAN;
BEGIN
    -- Busca dados do perfil contratado referenciado
    SELECT custo_mensal_perfil, documento_referencia, vigente
      INTO v_custo_mensal, v_doc_ref, v_vigente
      FROM perfis_contratados
     WHERE id = NEW.perfil_contratado_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil contratado ID % não localizado.', NEW.perfil_contratado_id;
    END IF;

    -- Snapshot do valor e documento vigente na data da alocação
    NEW.custo_mensal_perfil := v_custo_mensal;
    NEW.documento_referencia := v_doc_ref;

    -- Cálculo automático do Custo da Alocação
    NEW.custo_alocacao := ROUND((NEW.percentual_alocacao::NUMERIC * v_custo_mensal) / 100.0, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_before_insert_update_alocacao
BEFORE INSERT OR UPDATE ON alocacoes_perfil_os
FOR EACH ROW
EXECUTE FUNCTION fn_trg_processar_alocacao_perfil();
`;

export const MYSQL_DDL = `-- ========================================================================
-- SISTEMA DE GERENCIAMENTO DE ORDENS DE SERVIÇO
-- DIALETO: MySQL (8.0+) / MariaDB
-- ========================================================================

CREATE DATABASE IF NOT EXISTS gestao_ordens_servico 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE gestao_ordens_servico;

-- 1. Tabela: Perfis Contratados
CREATE TABLE perfis_contratados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_contratacao VARCHAR(100) NOT NULL,
    nome_perfil VARCHAR(150) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    custo_mensal_perfil DECIMAL(12, 2) NOT NULL,
    quantidade_mensal_contratada INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_perfis_custo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_perfis_qtd CHECK (quantidade_mensal_contratada >= 0)
) ENGINE=InnoDB;


-- 2. Tabela: Projeto
CREATE TABLE projetos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome_projeto VARCHAR(200) NOT NULL,
    sigla_projeto VARCHAR(50) NOT NULL,
    descricao VARCHAR(500),
    nome_secretaria VARCHAR(200) NOT NULL,
    sigla_secretaria VARCHAR(50) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)
) ENGINE=InnoDB;


-- 3. Tabela: Ordem de Serviço (1 Projeto -> N Ordens de Serviço)
CREATE TABLE ordens_servico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    numero_os INT NOT NULL,
    ano_referencia INT NOT NULL,
    mes_referencia VARCHAR(20) NOT NULL,
    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    situacao_sgc VARCHAR(100),
    situacao_passivo_2026 VARCHAR(100),
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_os_projeto 
        FOREIGN KEY (projeto_id) 
        REFERENCES projetos (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT chk_os_numero CHECK (numero_os > 0),
    CONSTRAINT chk_os_ano CHECK (ano_referencia BETWEEN 2000 AND 2100),
    CONSTRAINT chk_os_mes CHECK (
        mes_referencia IN (
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 
            'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 
            'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        )
    ),
    CONSTRAINT unq_os_proj_ano_num UNIQUE (projeto_id, numero_os, ano_referencia)
) ENGINE=InnoDB;


-- 4. Tabela: Alocação de Perfis na Ordem de Serviço (N:N)
CREATE TABLE alocacoes_perfil_os (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL,
    perfil_contratado_id BIGINT NOT NULL,
    nome_profissional VARCHAR(200) NOT NULL,
    percentual_alocacao INT NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    custo_mensal_perfil DECIMAL(12, 2) NOT NULL,
    custo_alocacao DECIMAL(12, 2) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alocacao_os 
        FOREIGN KEY (ordem_servico_id) 
        REFERENCES ordens_servico (id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,

    CONSTRAINT fk_alocacao_perfil 
        FOREIGN KEY (perfil_contratado_id) 
        REFERENCES perfis_contratados (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT chk_percentual_alocacao CHECK (percentual_alocacao >= 0 AND percentual_alocacao <= 100)
) ENGINE=InnoDB;


-- ========================================================================
-- REGRA DE NEGÓCIO: TRIGGERS MYSQL
-- ========================================================================
DELIMITER $$

CREATE TRIGGER trg_before_insert_alocacoes
BEFORE INSERT ON alocacoes_perfil_os
FOR EACH ROW
BEGIN
    DECLARE v_custo DECIMAL(12,2);
    DECLARE v_doc VARCHAR(255);

    SELECT custo_mensal_perfil, documento_referencia 
      INTO v_custo, v_doc
      FROM perfis_contratados 
     WHERE id = NEW.perfil_contratado_id;

    SET NEW.custo_mensal_perfil = v_custo;
    SET NEW.documento_referencia = v_doc;
    SET NEW.custo_alocacao = ROUND((NEW.percentual_alocacao * v_custo) / 100.0, 2);
END$$

CREATE TRIGGER trg_before_update_alocacoes
BEFORE UPDATE ON alocacoes_perfil_os
FOR EACH ROW
BEGIN
    DECLARE v_custo DECIMAL(12,2);
    DECLARE v_doc VARCHAR(255);

    SELECT custo_mensal_perfil, documento_referencia 
      INTO v_custo, v_doc
      FROM perfis_contratados 
     WHERE id = NEW.perfil_contratado_id;

    SET NEW.custo_mensal_perfil = v_custo;
    SET NEW.documento_referencia = v_doc;
    SET NEW.custo_alocacao = ROUND((NEW.percentual_alocacao * v_custo) / 100.0, 2);
END$$

DELIMITER ;
`;

export const SQLSERVER_DDL = `-- ========================================================================
-- SISTEMA DE GERENCIAMENTO DE ORDENS DE SERVIÇO
-- DIALETO: Microsoft SQL Server (T-SQL)
-- ========================================================================

-- 1. Perfis Contratados
CREATE TABLE perfis_contratados (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_contratacao VARCHAR(100) NOT NULL,
    nome_perfil VARCHAR(150) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    vigente BIT NOT NULL CONSTRAINT df_perfis_vigente DEFAULT 1,
    custo_mensal_perfil DECIMAL(12, 2) NOT NULL,
    quantidade_mensal_contratada INT NOT NULL,
    criado_em DATETIMEOFFSET NOT NULL CONSTRAINT df_perfis_criado DEFAULT SYSDATETIMEOFFSET(),
    
    CONSTRAINT chk_perfis_custo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_perfis_qtd CHECK (quantidade_mensal_contratada >= 0)
);

-- 2. Projetos
CREATE TABLE projetos (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    nome_projeto VARCHAR(200) NOT NULL,
    sigla_projeto VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NULL,
    nome_secretaria VARCHAR(200) NOT NULL,
    sigla_secretaria VARCHAR(50) NOT NULL,
    criado_em DATETIMEOFFSET NOT NULL CONSTRAINT df_projetos_criado DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT unq_projetos_sigla UNIQUE (sigla_projeto)
);

-- 3. Ordens de Serviço (1:N com Projetos)
CREATE TABLE ordens_servico (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    numero_os INT NOT NULL,
    ano_referencia INT NOT NULL,
    mes_referencia VARCHAR(20) NOT NULL,
    alocacao_sgc BIT NOT NULL CONSTRAINT df_os_aloc_sgc DEFAULT 0,
    entrega_sgc BIT NOT NULL CONSTRAINT df_os_ent_sgc DEFAULT 0,
    descricao_sgc BIT NOT NULL CONSTRAINT df_os_desc_sgc DEFAULT 0,
    situacao_sgc VARCHAR(100) NULL,
    situacao_passivo_2026 VARCHAR(100) NULL,
    criado_em DATETIMEOFFSET NOT NULL CONSTRAINT df_os_criado DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT fk_os_projeto FOREIGN KEY (projeto_id) REFERENCES projetos(id),
    CONSTRAINT chk_os_numero CHECK (numero_os > 0),
    CONSTRAINT chk_os_ano CHECK (ano_referencia BETWEEN 2000 AND 2100),
    CONSTRAINT chk_os_mes CHECK (mes_referencia IN (
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ))
);

-- 4. Alocação de Perfis na Ordem de Serviço (N:N)
CREATE TABLE alocacoes_perfil_os (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL,
    perfil_contratado_id BIGINT NOT NULL,
    nome_profissional VARCHAR(200) NOT NULL,
    percentual_alocacao INT NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    custo_mensal_perfil DECIMAL(12, 2) NOT NULL,
    custo_alocacao DECIMAL(12, 2) NOT NULL,
    criado_em DATETIMEOFFSET NOT NULL CONSTRAINT df_aloc_criado DEFAULT SYSDATETIMEOFFSET(),

    CONSTRAINT fk_alocacao_os FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE CASCADE,
    CONSTRAINT fk_alocacao_perfil FOREIGN KEY (perfil_contratado_id) REFERENCES perfis_contratados(id),
    CONSTRAINT chk_percentual_alocacao CHECK (percentual_alocacao BETWEEN 0 AND 100)
);
`;

export const SQLITE_DDL = `-- ========================================================================
-- SISTEMA DE GERENCIAMENTO DE ORDENS DE SERVIÇO
-- DIALETO: SQLite (Compatível com ANSI SQL)
-- ========================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE perfis_contratados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_contratacao TEXT NOT NULL,
    nome_perfil TEXT NOT NULL,
    documento_referencia TEXT NOT NULL,
    vigente INTEGER NOT NULL DEFAULT 1 CHECK (vigente IN (0, 1)),
    custo_mensal_perfil REAL NOT NULL CHECK (custo_mensal_perfil >= 0.0),
    quantidade_mensal_contratada INTEGER NOT NULL CHECK (quantidade_mensal_contratada >= 0),
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_projeto TEXT NOT NULL,
    sigla_projeto TEXT NOT NULL UNIQUE,
    descricao TEXT,
    nome_secretaria TEXT NOT NULL,
    sigla_secretaria TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE ordens_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projeto_id INTEGER NOT NULL,
    numero_os INTEGER NOT NULL CHECK (numero_os > 0),
    ano_referencia INTEGER NOT NULL,
    mes_referencia TEXT NOT NULL CHECK (
        mes_referencia IN (
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 
            'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 
            'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        )
    ),
    alocacao_sgc INTEGER NOT NULL DEFAULT 0 CHECK (alocacao_sgc IN (0, 1)),
    entrega_sgc INTEGER NOT NULL DEFAULT 0 CHECK (entrega_sgc IN (0, 1)),
    descricao_sgc INTEGER NOT NULL DEFAULT 0 CHECK (descricao_sgc IN (0, 1)),
    situacao_sgc TEXT,
    situacao_passivo_2026 TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (projeto_id) REFERENCES projetos (id) ON DELETE RESTRICT
);

CREATE TABLE alocacoes_perfil_os (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_servico_id INTEGER NOT NULL,
    perfil_contratado_id INTEGER NOT NULL,
    nome_profissional TEXT NOT NULL,
    percentual_alocacao INTEGER NOT NULL CHECK (percentual_alocacao >= 0 AND percentual_alocacao <= 100),
    documento_referencia TEXT NOT NULL,
    custo_mensal_perfil REAL NOT NULL,
    custo_alocacao REAL NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico (id) ON DELETE CASCADE,
    FOREIGN KEY (perfil_contratado_id) REFERENCES perfis_contratados (id) ON DELETE RESTRICT
);

-- Trigger SQLite para preenchimento e cálculo automático
CREATE TRIGGER trg_alocacoes_perfil_insert
AFTER INSERT ON alocacoes_perfil_os
FOR EACH ROW
WHEN NEW.custo_mensal_perfil = 0 OR NEW.custo_alocacao = 0
BEGIN
    UPDATE alocacoes_perfil_os
       SET documento_referencia = (SELECT documento_referencia FROM perfis_contratados WHERE id = NEW.perfil_contratado_id),
           custo_mensal_perfil = (SELECT custo_mensal_perfil FROM perfis_contratados WHERE id = NEW.perfil_contratado_id),
           custo_alocacao = ROUND((NEW.percentual_alocacao * (SELECT custo_mensal_perfil FROM perfis_contratados WHERE id = NEW.perfil_contratado_id)) / 100.0, 2)
     WHERE id = NEW.id;
END;
`;

export const SEEDS_SQL = `-- ========================================================================
-- SCRIPT DE CARGA INICIAL (SEEDS COM VALORES PADRÃO BRASILEIRO)
-- ========================================================================

-- 1. Inserção de Perfis Contratados
INSERT INTO perfis_contratados 
(item_contratacao, nome_perfil, documento_referencia, vigente, custo_mensal_perfil, quantidade_mensal_contratada)
VALUES 
('Item 01', 'Líder Técnico / Arquiteto de Software', 'Contrato 45/2024 - Lote 1', TRUE, 18500.00, 3),
('Item 02', 'Desenvolvedor Full-Stack Sênior', 'Contrato 45/2024 - Lote 1', TRUE, 14200.00, 6),
('Item 03', 'Desenvolvedor Full-Stack Pleno', 'Contrato 45/2024 - Lote 1', TRUE, 9800.00, 10),
('Item 04', 'Analista de Requisitos e Negócios Pleno', 'Contrato 45/2024 - Lote 2', TRUE, 9500.00, 4),
('Item 05', 'Engenheiro de DevOps / Cloud Sênior', 'Contrato 45/2024 - Lote 2', TRUE, 15000.00, 2),
('Item 06', 'Designer UI/UX Pleno', 'Contrato 45/2024 - Lote 2', TRUE, 8700.00, 2);

-- 2. Inserção de Projetos
INSERT INTO projetos 
(nome_projeto, sigla_projeto, descricao, nome_secretaria, sigla_secretaria)
VALUES
('Sistema de Gestão Corporativa Integrada', 'SGC-CORP', 'Modernização do fluxo de processos e compras governamentais', 'Secretaria de Planejamento e Gestão', 'SEPLAG'),
('Portal da Transparência e Arrecadação Digital', 'TRANS-SEFAZ', 'Plataforma fiscal de autoatendimento ao contribuinte', 'Secretaria da Fazenda', 'SEFAZ'),
('Prontuário Eletrônico Unificado', 'PEU-SAUDE', 'Integração de unidades de saúde e regulação de leitos', 'Secretaria de Estado de Saúde', 'SES');

-- 3. Inserção de Ordens de Serviço (1:N)
INSERT INTO ordens_servico 
(projeto_id, numero_os, ano_referencia, mes_referencia, alocacao_sgc, entrega_sgc, descricao_sgc, situacao_sgc, situacao_passivo_2026)
VALUES
(1, 101, 2026, 'JANEIRO', TRUE, TRUE, TRUE, 'Atestada pelo Fiscal', 'Liquidado'),
(1, 102, 2026, 'FEVEREIRO', TRUE, TRUE, FALSE, 'Em Execução', 'A Empenhar'),
(2, 201, 2026, 'JANEIRO', TRUE, FALSE, TRUE, 'Em Validação SGC', 'Passivo Reconhecido'),
(3, 301, 2026, 'MARÇO', FALSE, FALSE, FALSE, 'Planejada', 'Sem Passivo');

-- 4. Inserção de Alocações (N:N com snapshot e regra de cálculo acionada via trigger ou manual)
-- Observação: com o Trigger ativo, basta informar ordem_servico_id, perfil_contratado_id, nome_profissional e percentual_alocacao!
INSERT INTO alocacoes_perfil_os 
(ordem_servico_id, perfil_contratado_id, nome_profissional, percentual_alocacao, documento_referencia, custo_mensal_perfil, custo_alocacao)
VALUES
(1, 1, 'Carlos Eduardo Mendes', 100, 'Contrato 45/2024 - Lote 1', 18500.00, 18500.00),
(1, 2, 'Mariana Vasconcelos', 100, 'Contrato 45/2024 - Lote 1', 14200.00, 14200.00),
(1, 3, 'Rodrigo Silveira', 50, 'Contrato 45/2024 - Lote 1', 9800.00, 4900.00),
(2, 2, 'Mariana Vasconcelos', 50, 'Contrato 45/2024 - Lote 1', 14200.00, 7100.00),
(2, 3, 'Lucas Pinheiro', 100, 'Contrato 45/2024 - Lote 1', 9800.00, 9800.00),
(3, 5, 'Ana Beatriz Costa', 100, 'Contrato 45/2024 - Lote 2', 15000.00, 15000.00);
`;

export const QUERIES_SQL = `-- ========================================================================
-- QUERIES ANALÍTICAS & RELATÓRIOS DO SISTEMA DE ORDENS DE SERVIÇO
-- ========================================================================

-- 1. Relatório Consolidado de OS com Custo Total Alocado e Dados do Projeto
SELECT 
    p.sigla_secretaria AS secretaria,
    p.sigla_projeto AS projeto,
    os.numero_os,
    os.mes_referencia,
    os.ano_referencia,
    os.situacao_sgc,
    os.situacao_passivo_2026,
    COUNT(a.id) AS total_profissionais_alocados,
    COALESCE(SUM(a.percentual_alocacao), 0) AS soma_percentual_alocado,
    COALESCE(SUM(a.custo_alocacao), 0.00) AS custo_total_os
FROM ordens_servico os
JOIN projetos p ON p.id = os.projeto_id
LEFT JOIN alocacoes_perfil_os a ON a.ordem_servico_id = os.id
GROUP BY 
    p.sigla_secretaria, p.sigla_projeto, os.id, os.numero_os, 
    os.mes_referencia, os.ano_referencia, os.situacao_sgc, os.situacao_passivo_2026
ORDER BY p.sigla_secretaria, os.ano_referencia DESC, os.numero_os ASC;


-- 2. Detalhamento de Equipe e Histórico Contratual por Ordem de Serviço
SELECT 
    os.numero_os,
    os.mes_referencia || '/' || os.ano_referencia AS periodo,
    p.sigla_projeto,
    a.nome_profissional,
    pc.nome_perfil,
    a.percentual_alocacao || '%' AS alocacao,
    a.documento_referencia AS doc_ref_historico,
    a.custo_mensal_perfil AS valor_mensal_perfil,
    a.custo_alocacao AS valor_calculado
FROM alocacoes_perfil_os a
JOIN ordens_servico os ON os.id = a.ordem_servico_id
JOIN projetos p ON p.id = os.projeto_id
JOIN perfis_contratados pc ON pc.id = a.perfil_contratado_id
ORDER BY os.numero_os, a.nome_profissional;


-- 3. Acompanhamento de Pendências no SGC e Passivo 2026
SELECT 
    p.sigla_secretaria,
    p.nome_projeto,
    os.numero_os,
    os.mes_referencia,
    os.ano_referencia,
    CASE WHEN os.alocacao_sgc THEN 'OK' ELSE 'PENDENTE' END AS status_alocacao_sgc,
    CASE WHEN os.entrega_sgc THEN 'OK' ELSE 'PENDENTE' END AS status_entrega_sgc,
    CASE WHEN os.descricao_sgc THEN 'OK' ELSE 'PENDENTE' END AS status_descricao_sgc,
    os.situacao_passivo_2026
FROM ordens_servico os
JOIN projetos p ON p.id = os.projeto_id
WHERE os.alocacao_sgc = FALSE 
   OR os.entrega_sgc = FALSE 
   OR os.descricao_sgc = FALSE
   OR os.situacao_passivo_2026 IS NOT NULL;
`;
