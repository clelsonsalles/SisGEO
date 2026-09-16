-- ========================================================================
-- SISTEMA DE GESTÃO DE ORDENS DE SERVIÇO - SisGOS
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS POSTGRESQL (init.sql)
-- MAPEAMENTO: /docker-entrypoint-initdb.d/01-init.sql
-- ========================================================================

-- Garante codificação UTF-8 e timezone padrão
SET client_encoding = 'UTF8';
SET timezone = 'America/Sao_Paulo';

-- ------------------------------------------------------------------------
-- 1. Tabela: Perfis Contratados
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfis_contratados (
    id BIGSERIAL PRIMARY KEY,
    item_contratacao VARCHAR(100) NOT NULL,
    nome_perfil VARCHAR(150) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    quantidade_mensal_contratada INTEGER NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_perfis_custo_positivo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_perfis_qtd_positiva CHECK (quantidade_mensal_contratada >= 0)
);

COMMENT ON TABLE perfis_contratados IS 'Catálogo de perfis contratados com seus custos e documentos base';

-- ------------------------------------------------------------------------
-- 2. Tabela: Projetos
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projetos (
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

-- ------------------------------------------------------------------------
-- 3. Tabela: Ordens de Serviço (1 Projeto -> N Ordens de Serviço)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ordens_servico (
    id BIGSERIAL PRIMARY KEY,
    projeto_id BIGINT NOT NULL,
    numero_os INTEGER NOT NULL,
    ano_referencia INTEGER NOT NULL,
    alocacao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    entrega_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_sgc BOOLEAN NOT NULL DEFAULT FALSE,
    situacao_sgc VARCHAR(100),
    situacao_passivo_2026 VARCHAR(100),
    ne_planejamento VARCHAR(60),
    ne_faturamento VARCHAR(60),
    processo_sei_pagamento VARCHAR(60),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_os_projeto 
        FOREIGN KEY (projeto_id) 
        REFERENCES projetos (id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT chk_os_numero_positivo CHECK (numero_os > 0),
    CONSTRAINT unq_os_projeto_ano_numero UNIQUE (projeto_id, numero_os, ano_referencia)
);

CREATE INDEX IF NOT EXISTS idx_os_projeto_id ON ordens_servico(projeto_id);
CREATE INDEX IF NOT EXISTS idx_os_ano ON ordens_servico(ano_referencia);

-- ------------------------------------------------------------------------
-- 4. Tabela Associativa: Alocações de Perfis na OS (N:N)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alocacoes_perfil_os (
    id BIGSERIAL PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL,
    perfil_contratado_id BIGINT NOT NULL,
    mes_referencia VARCHAR(20) NOT NULL,
    nome_profissional VARCHAR(200) NOT NULL,
    percentual_alocacao NUMERIC(5, 2) NOT NULL,
    documento_referencia VARCHAR(255) NOT NULL,
    custo_mensal_perfil NUMERIC(12, 2) NOT NULL,
    custo_alocacao NUMERIC(12, 2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT chk_percentual_alocacao CHECK (percentual_alocacao >= 0.00 AND percentual_alocacao <= 100.00),
    CONSTRAINT chk_custo_mensal_positivo CHECK (custo_mensal_perfil >= 0.00),
    CONSTRAINT chk_custo_alocacao_positivo CHECK (custo_alocacao >= 0.00),
    CONSTRAINT chk_os_mes_valido CHECK (
        mes_referencia IN (
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 
            'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 
            'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        )
    ),
    CONSTRAINT unq_alocacao_os_perfil_mes UNIQUE (ordem_servico_id, nome_profissional, mes_referencia)
);

CREATE INDEX IF NOT EXISTS idx_alocacoes_os_id ON alocacoes_perfil_os(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_perfil_id ON alocacoes_perfil_os(perfil_contratado_id);
CREATE INDEX IF NOT EXISTS idx_alocacoes_os_nome_mes ON alocacoes_perfil_os(ordem_servico_id, nome_profissional, mes_referencia);

-- ------------------------------------------------------------------------
-- 5. Trigger PL/pgSQL: Automação da Regra de Negócio de Alocação
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_processar_alocacao_perfil()
RETURNS TRIGGER AS $$
DECLARE
    v_custo_mensal NUMERIC(12, 2);
    v_doc_ref VARCHAR(255);
    v_vigente BOOLEAN;
BEGIN
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

    -- Cálculo automático do Custo da Alocação: (Percentual * Custo Mensal) / 100
    NEW.custo_alocacao := ROUND((NEW.percentual_alocacao * v_custo_mensal) / 100.0, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_insert_update_alocacao ON alocacoes_perfil_os;
CREATE TRIGGER trg_before_insert_update_alocacao
BEFORE INSERT OR UPDATE ON alocacoes_perfil_os
FOR EACH ROW
EXECUTE FUNCTION fn_trg_processar_alocacao_perfil();

-- ------------------------------------------------------------------------
-- 6. Carga Inicial de Dados (Seed Data)
-- ------------------------------------------------------------------------
INSERT INTO perfis_contratados 
(item_contratacao, nome_perfil, documento_referencia, vigente, custo_mensal_perfil, quantidade_mensal_contratada)
VALUES 
('Item 01', 'Líder Técnico / Arquiteto de Software', 'Contrato 45/2024 - Lote 1', TRUE, 18500.00, 3),
('Item 02', 'Desenvolvedor Full-Stack Sênior', 'Contrato 45/2024 - Lote 1', TRUE, 14200.00, 6),
('Item 03', 'Desenvolvedor Full-Stack Pleno', 'Contrato 45/2024 - Lote 1', TRUE, 9800.00, 10),
('Item 04', 'Analista de Requisitos e Negócios Pleno', 'Contrato 45/2024 - Lote 2', TRUE, 9500.00, 4),
('Item 05', 'Engenheiro de DevOps / Cloud Sênior', 'Contrato 45/2024 - Lote 2', TRUE, 15000.00, 2),
('Item 06', 'Designer UI/UX Pleno', 'Contrato 45/2024 - Lote 2', TRUE, 8700.00, 2)
ON CONFLICT DO NOTHING;

INSERT INTO projetos 
(nome_projeto, sigla_projeto, descricao, nome_secretaria, sigla_secretaria)
VALUES
('Sistema de Gestão Corporativa Integrada', 'SGC-CORP', 'Modernização do fluxo de processos e compras governamentais', 'Secretaria de Planejamento e Gestão', 'SEPLAG'),
('Portal da Transparência e Arrecadação Digital', 'TRANS-SEFAZ', 'Plataforma fiscal de autoatendimento ao contribuinte', 'Secretaria da Fazenda', 'SEFAZ'),
('Prontuário Eletrônico Unificado', 'PEU-SAUDE', 'Integração de unidades de saúde e regulação de leitos', 'Secretaria de Estado de Saúde', 'SES'),
('Plataforma de Gestão da Educação Básica', 'EDU-DIGITAL', 'Acompanhamento pedagógico, merenda e frequência escolar', 'Secretaria de Estado de Educação', 'SEDUC')
ON CONFLICT DO NOTHING;

INSERT INTO ordens_servico 
(projeto_id, numero_os, ano_referencia, alocacao_sgc, entrega_sgc, descricao_sgc, situacao_sgc, situacao_passivo_2026, ne_planejamento, ne_faturamento, processo_sei_pagamento)
VALUES
(1, 101, 2026, TRUE, TRUE, TRUE, 'Atestada pelo Fiscal', 'Liquidado', '2026NE000142', '2026NE000189', 'SEI-08001/002341/2026'),
(1, 102, 2026, TRUE, TRUE, FALSE, 'Em Execução', 'A Empenhar', '2026NE000142', NULL, NULL),
(2, 201, 2026, TRUE, FALSE, TRUE, 'Em Validação SGC', 'Passivo Reconhecido', '2026NE000215', '2026NE000280', 'SEI-08001/002955/2026'),
(3, 301, 2026, FALSE, FALSE, FALSE, 'Planejada', 'Sem Passivo', '2026NE000301', '2026NE000301', 'SEI-08001/003112/2026')
ON CONFLICT DO NOTHING;

INSERT INTO alocacoes_perfil_os 
(ordem_servico_id, perfil_contratado_id, mes_referencia, nome_profissional, percentual_alocacao, documento_referencia, custo_mensal_perfil, custo_alocacao)
VALUES
(1, 1, 'JANEIRO', 'Carlos Eduardo Silveira', 50.00, 'Contrato 45/2024 - Lote 1', 18500.00, 9250.00),
(1, 2, 'JANEIRO', 'Mariana Souza Ribeiro', 45.50, 'Contrato 45/2024 - Lote 1', 14200.00, 6461.00),
(2, 2, 'FEVEREIRO', 'Mariana Souza Ribeiro', 50.00, 'Contrato 45/2024 - Lote 1', 14200.00, 7100.00),
(2, 3, 'FEVEREIRO', 'Lucas Pinheiro Castro', 100.00, 'Contrato 45/2024 - Lote 1', 9800.00, 9800.00),
(3, 5, 'JANEIRO', 'Ana Beatriz Medeiros', 100.00, 'Contrato 45/2024 - Lote 2', 15000.00, 15000.00)
ON CONFLICT DO NOTHING;
